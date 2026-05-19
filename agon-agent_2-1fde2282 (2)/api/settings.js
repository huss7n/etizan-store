import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return res.status(200).json(data || {});
    }

    if (req.method === 'PUT') {
      const updates = req.body;
      
      // Check if settings exist
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .single();
      
      let result;
      if (existing) {
        const { data, error } = await supabase
          .from('settings')
          .update(updates)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('settings')
          .insert(updates)
          .select()
          .single();
        if (error) throw error;
        result = data;
      }
      
      return res.status(200).json(result);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Settings API error:', err);
    res.status(500).json({ error: err.message });
  }
}