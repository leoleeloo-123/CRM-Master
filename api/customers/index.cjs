const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Supabase not configured' });

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    switch (req.method) {
      case 'GET':
        const { data: customers, error } = await supabase.from('customers').select('*').order('updated_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json(customers);

      case 'POST':
        const { data: newCustomer, error: createError } = await supabase.from('customers').insert([req.body]).select().single();
        if (createError) throw createError;
        return res.status(201).json(newCustomer);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
