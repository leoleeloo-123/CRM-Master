// Vercel Serverless Function - Customer by ID
// GET /api/customers/:id - Get customer
// PUT /api/customers/:id - Update customer
// DELETE /api/customers/:id - Delete customer

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase credentials not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { id } = req.query;

  try {
    switch (req.method) {
      case 'GET':
        const { data: customer, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        return res.status(200).json(customer);

      case 'PUT':
        const { data: updated, error: updateError } = await supabase
          .from('customers')
          .update(req.body)
          .eq('id', id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        return res.status(200).json(updated);

      case 'DELETE':
        const { error: deleteError } = await supabase
          .from('customers')
          .delete()
          .eq('id', id);
        
        if (deleteError) throw deleteError;
        return res.status(204).end();

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
