import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'رمز التحميل مفقود' });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, products(title, file_url, file_name)')
      .eq('download_token', token)
      .eq('status', 'approved')
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'رابط التحميل غير صالح' });
    }

    // Check expiry
    if (new Date(order.download_expires_at) < new Date()) {
      return res.status(410).json({ error: 'انتهت صلاحية رابط التحميل' });
    }

    return res.status(200).json({
      product_title: order.products.title,
      file_url: order.products.file_url,
      file_name: order.products.file_name,
      expires_at: order.download_expires_at
    });

  } catch (err) {
    console.error('Download API error:', err);
    res.status(500).json({ error: err.message });
  }
}