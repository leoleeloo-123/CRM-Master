import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

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

// Convert frontend expense format to DB format (camelCase -> snake_case)
const toDbFormat = (expense) => {
  const result = {};
  
  if (expense.id !== undefined) result.id = expense.id;
  if (expense.category !== undefined) result.category = expense.category;
  if (expense.detail !== undefined) result.detail = expense.detail;
  if (expense.expInc !== undefined) result.exp_inc = expense.expInc;
  if (expense.party !== undefined) result.party = expense.party;
  if (expense.name !== undefined) result.name = expense.name;
  if (expense.status !== undefined) result.status = expense.status;
  if (expense.currency !== undefined) result.currency = expense.currency;
  if (expense.balance !== undefined) result.balance = expense.balance;
  if (expense.comment !== undefined) result.comment = expense.comment;
  if (expense.link !== undefined) result.link = expense.link;
  
  // Date fields
  if (expense.originationDate !== undefined) result.origination_date = formatDateField(expense.originationDate);
  if (expense.transactionDate !== undefined) result.transaction_date = formatDateField(expense.transactionDate);
  
  return result;
};

// Convert DB format to frontend format (snake_case -> camelCase)
const fromDbFormat = (dbExpense) => {
  if (!dbExpense) return null;
  
  return {
    id: dbExpense.id,
    category: dbExpense.category,
    detail: dbExpense.detail,
    expInc: dbExpense.exp_inc,
    party: dbExpense.party,
    name: dbExpense.name,
    status: dbExpense.status,
    currency: dbExpense.currency,
    balance: dbExpense.balance,
    comment: dbExpense.comment,
    link: dbExpense.link,
    originationDate: dbExpense.origination_date,
    transactionDate: dbExpense.transaction_date,
    createdAt: dbExpense.created_at,
    updatedAt: dbExpense.updated_at
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
          const { data, error } = await supabase.from('expenses').select('*').eq('id', id).single();
          if (error) throw error;
          if (!data) return res.status(404).json({ error: 'Not found' });
          return res.status(200).json(fromDbFormat(data));
        } else {
          const { data, error } = await supabase.from('expenses').select('*').order('transaction_date', { ascending: false });
          if (error) throw error;
          return res.status(200).json((data || []).map(fromDbFormat));
        }

      case 'POST':
        const dbData = toDbFormat(req.body);
        const { data: created, error: createError } = await supabase.from('expenses').insert([dbData]).select().single();
        if (createError) throw createError;
        return res.status(201).json(fromDbFormat(created));

      case 'PUT':
        if (!id) return res.status(400).json({ error: 'ID required' });
        const updateData = toDbFormat(req.body);
        const { data: updated, error: updateError } = await supabase.from('expenses').update(updateData).eq('id', id).select().single();
        if (updateError) throw updateError;
        return res.status(200).json(fromDbFormat(updated));

      case 'DELETE':
        if (!id) return res.status(400).json({ error: 'ID required' });
        const { error: deleteError } = await supabase.from('expenses').delete().eq('id', id);
        if (deleteError) throw deleteError;
        return res.status(204).end();

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Expenses API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
