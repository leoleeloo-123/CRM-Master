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

// Convert frontend FX rate format to DB format (camelCase -> snake_case)
const toDbFormat = (fxRate) => {
  const result = {};
  
  if (fxRate.id !== undefined) result.id = fxRate.id;
  if (fxRate.currency !== undefined) result.currency = fxRate.currency;
  if (fxRate.rateToUSD !== undefined) result.rate_to_usd = fxRate.rateToUSD;
  if (fxRate.lastUpdated !== undefined) result.last_updated = formatDateField(fxRate.lastUpdated);
  
  return result;
};

// Convert DB format to frontend format (snake_case -> camelCase)
const fromDbFormat = (dbFxRate) => {
  if (!dbFxRate) return null;
  
  return {
    id: dbFxRate.id,
    currency: dbFxRate.currency,
    rateToUSD: dbFxRate.rate_to_usd,
    lastUpdated: dbFxRate.last_updated,
    createdAt: dbFxRate.created_at,
    updatedAt: dbFxRate.updated_at
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
          const { data, error } = await supabase.from('fx_rates').select('*').eq('id', id).single();
          if (error) throw error;
          if (!data) return res.status(404).json({ error: 'Not found' });
          return res.status(200).json(fromDbFormat(data));
        } else {
          const { data, error } = await supabase.from('fx_rates').select('*').order('currency');
          if (error) throw error;
          return res.status(200).json((data || []).map(fromDbFormat));
        }

      case 'POST':
        const dbData = toDbFormat(req.body);
        const { data: created, error: createError } = await supabase.from('fx_rates').insert([dbData]).select().single();
        if (createError) throw createError;
        return res.status(201).json(fromDbFormat(created));

      case 'PUT':
        if (!id) return res.status(400).json({ error: 'ID required' });
        const updateData = toDbFormat(req.body);
        const { data: updated, error: updateError } = await supabase.from('fx_rates').update(updateData).eq('id', id).select().single();
        if (updateError) throw updateError;
        return res.status(200).json(fromDbFormat(updated));

      case 'DELETE':
        if (!id) return res.status(400).json({ error: 'ID required' });
        const { error: deleteError } = await supabase.from('fx_rates').delete().eq('id', id);
        if (deleteError) throw deleteError;
        return res.status(204).end();

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('FX Rates API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
