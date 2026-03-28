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
        const { data, error } = await supabase.from('fx_rates').select('*').order('currency');
        if (error) throw error;
        return res.status(200).json(data);

      case 'POST':
        const { data: created, error: createError } = await supabase.from('fx_rates').insert([req.body]).select().single();
        if (createError) throw createError;
        return res.status(201).json(created);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
