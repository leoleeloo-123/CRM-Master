import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Helper to serialize array/object fields to strings for storage
const serializeField = (value) => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join('|||');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

// Helper to deserialize string fields back to original format
const deserializeField = (value, fieldName) => {
  if (value === null || value === undefined || value === '') {
    // Return appropriate default based on field name
    if (fieldName === 'region' || fieldName === 'tags' || fieldName === 'contacts' || 
        fieldName === 'interactions' || fieldName === 'docLinks') return [];
    if (fieldName === 'mailingInfo') return { recipient: '', phone: '', company: '', address: '' };
    return '';
  }
  
  // Fields that should be arrays
  if (fieldName === 'region' || fieldName === 'tags') {
    return String(value).split('|||').filter(s => s.trim());
  }
  
  // Fields that should be objects/arrays (stored as JSON)
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

// Convert frontend customer format to DB format (serialize complex fields)
const toDbFormat = (customer) => {
  return {
    id: customer.id,
    name: customer.name,
    region: serializeField(customer.region),
    rank: customer.rank,
    status: customer.status || 'Active',
    product_summary: customer.productSummary || '',
    last_status_update: customer.lastStatusUpdate || '',
    follow_up_status: customer.followUpStatus || 'No Action',
    contacts: serializeField(customer.contacts),
    next_action_date: customer.nextActionDate || '',
    tags: serializeField(customer.tags),
    interactions: serializeField(customer.interactions),
    doc_links: serializeField(customer.docLinks),
    upcoming_plan: customer.upcomingPlan || '',
    mailing_info: serializeField(customer.mailingInfo),
    last_customer_reply_date: customer.lastCustomerReplyDate || '',
    last_my_reply_date: customer.lastMyReplyDate || ''
  };
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
        const updateDbData = toDbFormat(req.body);
        const { data: updatedDb, error: updateError } = await supabase.from('customers').update(updateDbData).eq('id', id).select().single();
        if (updateError) throw updateError;
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
