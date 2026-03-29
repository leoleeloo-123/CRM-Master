import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

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
          const { data: customer, error } = await supabase.from('customers').select('*').eq('id', id).single();
          if (error) throw error;
          if (!customer) return res.status(404).json({ error: 'Customer not found' });
          return res.status(200).json(customer);
        } else {
          const { data: customers, error } = await supabase.from('customers').select('*').order('updated_at', { ascending: false });
          if (error) throw error;
          return res.status(200).json(customers);
        }

      case 'POST':
        const { data: newCustomer, error: createError } = await supabase.from('customers').insert([req.body]).select().single();
        if (createError) throw createError;
        return res.status(201).json(newCustomer);

      case 'PUT':
        if (!id) return res.status(400).json({ error: 'ID required' });
        // Only include fields that exist in the database schema
        const allowedFields = [
          'name', 'region', 'rank', 'status', 'productSummary', 'lastStatusUpdate',
          'followUpStatus', 'contacts', 'nextActionDate', 'tags', 'interactions',
          'docLinks', 'upcomingPlan', 'mailingInfo'
        ];
        const updateData = {};
        for (const field of allowedFields) {
          if (req.body.hasOwnProperty(field)) {
            updateData[field] = req.body[field];
          }
        }
        const { data: updated, error: updateError } = await supabase.from('customers').update(updateData).eq('id', id).select().single();
        if (updateError) throw updateError;
        return res.status(200).json(updated);

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
