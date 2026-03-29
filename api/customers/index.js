import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Helper to serialize array/object fields for PostgreSQL
const serializeField = (value, isDbArray = false, isJsonField = false) => {
  if (value === null || value === undefined) {
    return isDbArray ? [] : '';
  }
  // JSON fields (contacts, interactions, docLinks, mailingInfo) should always be JSON stringified
  if (isJsonField) {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    // For DB array columns, return the array directly
    // For text columns, join with delimiter
    return isDbArray ? value : value.join('|||');
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

// Helper to deserialize fields from DB format
const deserializeField = (value, fieldName) => {
  if (value === null || value === undefined || value === '') {
    // Return appropriate default based on field name
    if (fieldName === 'region' || fieldName === 'tags' || fieldName === 'contacts' || 
        fieldName === 'interactions' || fieldName === 'docLinks') return [];
    if (fieldName === 'mailingInfo') return { recipient: '', phone: '', company: '', address: '' };
    return '';
  }
  
  // If value is already an array (PostgreSQL array type), return it directly
  if (Array.isArray(value)) {
    return value;
  }
  
  // Fields that should be arrays - handle both DB array type and legacy text format
  if (fieldName === 'region' || fieldName === 'tags') {
    // If it's a string (legacy format), split by delimiter
    if (typeof value === 'string') {
      return value.split('|||').filter(s => s.trim());
    }
    return [];
  }
  
  // Fields that should be objects/arrays (stored as JSON text)
  if (fieldName === 'contacts' || fieldName === 'interactions' || fieldName === 'docLinks' || fieldName === 'mailingInfo') {
    try {
      return JSON.parse(value);
    } catch (e) {
      // Fallback for legacy format
      if (fieldName === 'contacts' || fieldName === 'interactions' || fieldName === 'docLinks') return [];
      if (fieldName === 'mailingInfo') return { recipient: '', phone: '', company: '', address: '' };
      return value;
    }
  }
  
  return value;
};

// Helper to format date fields - handle both TEXT and DATE column types
const formatDateField = (value) => {
  if (!value || value === '') return null;
  // Ensure date is in YYYY-MM-DD format
  const dateStr = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  // Try to parse and format
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (e) {}
  return null;
};

// Convert frontend customer format to DB format (serialize complex fields)
// Only include fields that are actually present in the request to avoid overwriting with empty values
const toDbFormat = (customer) => {
  const result = {};
  
  // Always include these basic fields
  if (customer.id !== undefined) result.id = customer.id;
  if (customer.name !== undefined) result.name = customer.name;
  if (customer.rank !== undefined) result.rank = customer.rank;
  if (customer.status !== undefined) result.status = customer.status || 'Active';
  
  // Serialize array/object fields
  // region and tags are array columns in DB (native PostgreSQL arrays)
  if (customer.region !== undefined) result.region = serializeField(customer.region, true);
  if (customer.tags !== undefined) result.tags = serializeField(customer.tags, true);
  // contacts, interactions, docLinks, mailingInfo are JSONB/text fields - need JSON stringification
  if (customer.contacts !== undefined) result.contacts = serializeField(customer.contacts, false, true);
  if (customer.interactions !== undefined) result.interactions = serializeField(customer.interactions, false, true);
  if (customer.docLinks !== undefined) result.doc_links = serializeField(customer.docLinks, false, true);
  if (customer.mailingInfo !== undefined) result.mailing_info = serializeField(customer.mailingInfo, false, true);
  
  // Text fields
  if (customer.productSummary !== undefined) result.product_summary = customer.productSummary || '';
  if (customer.followUpStatus !== undefined) result.follow_up_status = customer.followUpStatus || 'No Action';
  if (customer.upcomingPlan !== undefined) result.upcoming_plan = customer.upcomingPlan || '';
  
  // Date fields - only include if they have valid values
  if (customer.lastStatusUpdate !== undefined && customer.lastStatusUpdate) {
    result.last_status_update = formatDateField(customer.lastStatusUpdate);
  }
  if (customer.nextActionDate !== undefined && customer.nextActionDate) {
    result.next_action_date = formatDateField(customer.nextActionDate);
  }
  if (customer.lastCustomerReplyDate !== undefined && customer.lastCustomerReplyDate) {
    result.last_customer_reply_date = formatDateField(customer.lastCustomerReplyDate);
  }
  if (customer.lastMyReplyDate !== undefined && customer.lastMyReplyDate) {
    result.last_my_reply_date = formatDateField(customer.lastMyReplyDate);
  }
  
  return result;
};

// Convert DB format to frontend customer format (deserialize complex fields)
const fromDbFormat = (dbCustomer) => {
  return {
    id: dbCustomer.id,
    name: dbCustomer.name,
    region: deserializeField(dbCustomer.region, 'region'),
    rank: dbCustomer.rank,
    status: dbCustomer.status,
    productSummary: dbCustomer.product_summary || '',
    lastStatusUpdate: dbCustomer.last_status_update || '',
    followUpStatus: dbCustomer.follow_up_status || 'No Action',
    contacts: deserializeField(dbCustomer.contacts, 'contacts'),
    nextActionDate: dbCustomer.next_action_date || '',
    tags: deserializeField(dbCustomer.tags, 'tags'),
    interactions: deserializeField(dbCustomer.interactions, 'interactions'),
    docLinks: deserializeField(dbCustomer.doc_links, 'docLinks'),
    upcomingPlan: dbCustomer.upcoming_plan || '',
    mailingInfo: deserializeField(dbCustomer.mailing_info, 'mailingInfo'),
    lastCustomerReplyDate: dbCustomer.last_customer_reply_date || '',
    lastMyReplyDate: dbCustomer.last_my_reply_date || '',
    lastContactDate: dbCustomer.last_my_reply_date || '' // Computed from lastMyReplyDate
  };
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Supabase not configured' });

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { id } = req.query;

  try {
    switch (req.method) {
      case 'GET':
        if (id) {
          const { data: dbCustomer, error } = await supabase.from('customers').select('*').eq('id', id).single();
          if (error) throw error;
          if (!dbCustomer) return res.status(404).json({ error: 'Customer not found' });
          return res.status(200).json(fromDbFormat(dbCustomer));
        } else {
          const { data: dbCustomers, error } = await supabase.from('customers').select('*').order('updated_at', { ascending: false });
          if (error) throw error;
          return res.status(200).json(dbCustomers.map(fromDbFormat));
        }

      case 'POST':
        const dbData = toDbFormat(req.body);
        const { data: newDbCustomer, error: createError } = await supabase.from('customers').insert([dbData]).select().single();
        if (createError) throw createError;
        return res.status(201).json(fromDbFormat(newDbCustomer));

      case 'PUT':
        if (!id) return res.status(400).json({ error: 'ID required' });
        
        // First, get the existing customer to check which fields exist in DB
        const { data: existingCustomer, error: fetchError } = await supabase.from('customers').select('*').eq('id', id).single();
        if (fetchError) throw fetchError;
        
        // Build update data only with fields that exist in the database
        const dbFields = Object.keys(existingCustomer);
        const updateDbData = {};
        const serialized = toDbFormat(req.body);
        
        for (const field of dbFields) {
          if (serialized.hasOwnProperty(field)) {
            updateDbData[field] = serialized[field];
          }
        }
        
        // Debug: log what we're updating
        console.log('DB fields available:', dbFields);
        console.log('Serialized data fields:', Object.keys(serialized));
        console.log('Updating fields:', Object.keys(updateDbData));
        console.log('Update data:', JSON.stringify(updateDbData, null, 2));
        
        const { data: updatedDb, error: updateError } = await supabase.from('customers').update(updateDbData).eq('id', id).select().single();
        if (updateError) {
          console.error('Update error:', updateError);
          return res.status(400).json({ 
            error: updateError.message, 
            details: updateError.details,
            hint: updateError.hint,
            code: updateError.code
          });
        }
        return res.status(200).json(fromDbFormat(updatedDb));

      case 'DELETE':
        if (!id) return res.status(400).json({ error: 'ID required' });
        const { error: deleteError } = await supabase.from('customers').delete().eq('id', id);
        if (deleteError) throw deleteError;
        return res.status(204).end();

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
