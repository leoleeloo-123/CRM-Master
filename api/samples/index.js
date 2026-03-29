import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Helper to serialize array/object fields for PostgreSQL
const serializeField = (value, isDbArray = false, isJsonField = false) => {
  if (value === null || value === undefined) {
    return isDbArray ? [] : '';
  }
  // JSON fields should always be JSON stringified
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
    if (fieldName === 'productCategory' || fieldName === 'docLinks') return [];
    return '';
  }
  
  // If value is already an array (PostgreSQL array type), return it directly
  if (Array.isArray(value)) {
    return value;
  }
  
  // Fields that should be arrays - handle both DB array type and legacy text format
  if (fieldName === 'productCategory') {
    // If it's a string (legacy format), split by delimiter
    if (typeof value === 'string') {
      return value.split('|||').filter(s => s.trim());
    }
    return [];
  }
  
  // Fields that should be objects/arrays (stored as JSON text)
  if (fieldName === 'docLinks') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return [];
    }
  }
  
  return value;
};

// Helper to format date fields
const formatDateField = (value) => {
  if (!value || value === '') return null;
  const dateStr = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (e) {}
  return null;
};

// Convert frontend sample format to DB format (field name mapping: camelCase -> snake_case)
const toDbFormat = (sample) => {
  const result = {};
  
  // Basic fields
  if (sample.id !== undefined) result.id = sample.id;
  if (sample.customerId !== undefined) result.customer_id = sample.customerId;
  if (sample.customerName !== undefined) result.customer_name = sample.customerName;
  if (sample.sampleIndex !== undefined) result.sample_index = sample.sampleIndex;
  if (sample.sampleName !== undefined) result.sample_name = sample.sampleName;
  if (sample.sampleSKU !== undefined) result.sample_sku = sample.sampleSKU;
  if (sample.status !== undefined) result.status = sample.status;
  if (sample.testStatus !== undefined) result.test_status = sample.testStatus;
  if (sample.crystalType !== undefined) result.crystal_type = sample.crystalType;
  if (sample.productForm !== undefined) result.product_form = sample.productForm;
  if (sample.originalSize !== undefined) result.original_size = sample.originalSize;
  if (sample.processedSize !== undefined) result.processed_size = sample.processedSize;
  if (sample.nickname !== undefined) result.nickname = sample.nickname;
  if (sample.quantity !== undefined) result.quantity = sample.quantity;
  if (sample.application !== undefined) result.application = sample.application;
  if (sample.sampleDetails !== undefined) result.sample_details = sample.sampleDetails;
  if (sample.statusDetails !== undefined) result.status_details = sample.statusDetails;
  if (sample.trackingNumber !== undefined) result.tracking_number = sample.trackingNumber;
  if (sample.upcomingPlan !== undefined) result.upcoming_plan = sample.upcomingPlan;
  if (sample.isStarredSample !== undefined) result.is_starred = sample.isStarredSample;
  if (sample.isGraded !== undefined) result.is_graded = sample.isGraded;
  if (sample.isPaid !== undefined) result.is_paid = sample.isPaid;
  if (sample.feeCategory !== undefined) result.fee_category = sample.feeCategory;
  if (sample.feeType !== undefined) result.fee_type = sample.feeType;
  if (sample.actualUnitPrice !== undefined) result.actual_unit_price = sample.actualUnitPrice;
  if (sample.standardUnitPrice !== undefined) result.standard_unit_price = sample.standardUnitPrice;
  if (sample.currency !== undefined) result.currency = sample.currency;
  if (sample.balance !== undefined) result.balance = sample.balance;
  if (sample.feeComment !== undefined) result.fee_comment = sample.feeComment;
  if (sample.feeStatus !== undefined) result.fee_status = sample.feeStatus;
  
  // Array fields (PostgreSQL native arrays)
  if (sample.productCategory !== undefined) result.product_category = serializeField(sample.productCategory, true);
  
  // JSON fields
  if (sample.docLinks !== undefined) result.doc_links = serializeField(sample.docLinks, false, true);
  
  // Date fields
  // Note: requestDate is mapped to origination_date in DB
  if (sample.requestDate !== undefined) result.origination_date = formatDateField(sample.requestDate);
  if (sample.lastStatusDate !== undefined) result.last_status_date = formatDateField(sample.lastStatusDate);
  if (sample.originationDate !== undefined) result.origination_date = formatDateField(sample.originationDate);
  if (sample.transactionDate !== undefined) result.transaction_date = formatDateField(sample.transactionDate);
  if (sample.nextActionDate !== undefined) result.next_action_date = formatDateField(sample.nextActionDate);
  
  return result;
};

// Convert DB format to frontend format (field name mapping: snake_case -> camelCase)
const fromDbFormat = (dbSample) => {
  if (!dbSample) return null;
  
  return {
    id: dbSample.id,
    customerId: dbSample.customer_id,
    customerName: dbSample.customer_name,
    sampleIndex: dbSample.sample_index,
    sampleName: dbSample.sample_name,
    sampleSKU: dbSample.sample_sku,
    status: dbSample.status,
    testStatus: dbSample.test_status,
    crystalType: dbSample.crystal_type,
    productCategory: deserializeField(dbSample.product_category, 'productCategory'),
    productForm: dbSample.product_form,
    originalSize: dbSample.original_size,
    processedSize: dbSample.processed_size,
    nickname: dbSample.nickname,
    quantity: dbSample.quantity,
    application: dbSample.application,
    sampleDetails: dbSample.sample_details,
    statusDetails: dbSample.status_details,
    trackingNumber: dbSample.tracking_number,
    upcomingPlan: dbSample.upcoming_plan,
    nextActionDate: dbSample.next_action_date,
    isStarredSample: dbSample.is_starred,
    isGraded: dbSample.is_graded,
    isPaid: dbSample.is_paid,
    feeCategory: dbSample.fee_category,
    feeType: dbSample.fee_type,
    actualUnitPrice: dbSample.actual_unit_price,
    standardUnitPrice: dbSample.standard_unit_price,
    currency: dbSample.currency,
    balance: dbSample.balance,
    feeComment: dbSample.fee_comment,
    feeStatus: dbSample.fee_status,
    docLinks: deserializeField(dbSample.doc_links, 'docLinks'),
    // Note: origination_date in DB is mapped to requestDate in frontend
    requestDate: dbSample.origination_date,
    lastStatusDate: dbSample.last_status_date,
    originationDate: dbSample.origination_date,
    transactionDate: dbSample.transaction_date,
    createdAt: dbSample.created_at,
    updatedAt: dbSample.updated_at
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
          const { data, error } = await supabase.from('samples').select('*').eq('id', id).single();
          if (error) throw error;
          if (!data) return res.status(404).json({ error: 'Not found' });
          return res.status(200).json(fromDbFormat(data));
        } else {
          const { data, error } = await supabase.from('samples').select('*').order('updated_at', { ascending: false });
          if (error) throw error;
          return res.status(200).json((data || []).map(fromDbFormat));
        }

      case 'POST':
        const dbData = toDbFormat(req.body);
        const { data: created, error: createError } = await supabase.from('samples').insert([dbData]).select().single();
        if (createError) throw createError;
        return res.status(201).json(fromDbFormat(created));

      case 'PUT':
        if (!id) return res.status(400).json({ error: 'ID required' });
        const updateData = toDbFormat(req.body);
        const { data: updated, error: updateError } = await supabase.from('samples').update(updateData).eq('id', id).select().single();
        if (updateError) throw updateError;
        return res.status(200).json(fromDbFormat(updated));

      case 'DELETE':
        if (!id) return res.status(400).json({ error: 'ID required' });
        const { error: deleteError } = await supabase.from('samples').delete().eq('id', id);
        if (deleteError) throw deleteError;
        return res.status(204).end();

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Samples API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
