import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Helper to serialize array fields for PostgreSQL
const serializeField = (value, isDbArray = false) => {
  if (value === null || value === undefined) {
    return isDbArray ? [] : '';
  }
  if (Array.isArray(value)) {
    return isDbArray ? value : value.join('|||');
  }
  return String(value);
};

// Helper to deserialize fields from DB format
const deserializeField = (value, fieldName) => {
  if (value === null || value === undefined || value === '') {
    if (fieldName === 'eventSeries') return [];
    return '';
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (fieldName === 'eventSeries' && typeof value === 'string') {
    return value.split('|||').filter(s => s.trim());
  }
  return value;
};

// Helper to format date fields - handle empty strings
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

// Convert frontend exhibition format to DB format (camelCase -> snake_case)
const toDbFormat = (exhibition) => {
  const result = {};
  
  if (exhibition.id !== undefined) result.id = exhibition.id;
  if (exhibition.name !== undefined) result.name = exhibition.name;
  if (exhibition.date !== undefined) result.date = formatDateField(exhibition.date);
  if (exhibition.location !== undefined) result.location = exhibition.location;
  if (exhibition.link !== undefined) result.link = exhibition.link;
  if (exhibition.summary !== undefined) result.summary = exhibition.summary;
  
  // Array fields
  if (exhibition.eventSeries !== undefined) result.event_series = serializeField(exhibition.eventSeries, true);
  
  return result;
};

// Convert DB format to frontend format (snake_case -> camelCase)
const fromDbFormat = (dbExhibition) => {
  if (!dbExhibition) return null;
  
  return {
    id: dbExhibition.id,
    name: dbExhibition.name,
    date: dbExhibition.date,
    location: dbExhibition.location,
    link: dbExhibition.link,
    summary: dbExhibition.summary,
    eventSeries: deserializeField(dbExhibition.event_series, 'eventSeries'),
    createdAt: dbExhibition.created_at,
    updatedAt: dbExhibition.updated_at
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
          const { data, error } = await supabase.from('exhibitions').select('*').eq('id', id).single();
          if (error) throw error;
          if (!data) return res.status(404).json({ error: 'Not found' });
          return res.status(200).json(fromDbFormat(data));
        } else {
          const { data, error } = await supabase.from('exhibitions').select('*').order('date', { ascending: false });
          if (error) throw error;
          return res.status(200).json((data || []).map(fromDbFormat));
        }

      case 'POST':
        const dbData = toDbFormat(req.body);
        const { data: created, error: createError } = await supabase.from('exhibitions').insert([dbData]).select().single();
        if (createError) throw createError;
        return res.status(201).json(fromDbFormat(created));

      case 'PUT':
        if (!id) return res.status(400).json({ error: 'ID required' });
        const updateData = toDbFormat(req.body);
        const { data: updated, error: updateError } = await supabase.from('exhibitions').update(updateData).eq('id', id).select().single();
        if (updateError) throw updateError;
        return res.status(200).json(fromDbFormat(updated));

      case 'DELETE':
        if (!id) return res.status(400).json({ error: 'ID required' });
        const { error: deleteError } = await supabase.from('exhibitions').delete().eq('id', id);
        if (deleteError) throw deleteError;
        return res.status(204).end();

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Exhibitions API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
