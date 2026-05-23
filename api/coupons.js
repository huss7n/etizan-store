import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { code } = req.query;
      if (code) {
        // Validate coupon
        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .eq('code', code.toUpperCase())
          .eq('is_active', true)
          .single();
        
        if (error || !data) return res.status(404).json({ error: 'كوبون غير صالح' });
        
        const now = new Date();
        if (data.valid_until && new Date(data.valid_until) < now) {
          return res.status(400).json({ error: 'انتهت صلاحية الكوبون' });
        }
        if (data.used_count >= data.max_uses) {
          return res.status(400).json({ error: 'تم استنفاد الكوبون' });
        }
        
        return res.status(200).json(data);
      }
      
      // Get all coupons
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }
    
    if (req.method === 'POST') {
      const coupon = req.body;
      const { data, error } = await supabase
        .from('coupons')
        .insert({ ...coupon, code: coupon.code.toUpperCase() })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    
    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      const { data, error } = await supabase
        .from('coupons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    
    if (req.method === 'DELETE') {
      const { id } = req.body;
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}