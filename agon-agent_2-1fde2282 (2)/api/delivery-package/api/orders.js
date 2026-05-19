import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('orders')
        .select('*, products(title, price)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { product_id, customer_name, customer_email, customer_phone, payment_method, receipt_image, amount_paid } = req.body;
      
      const order_number = 'ETZ-' + Date.now().toString().slice(-8);
      
      const { data, error } = await supabase
        .from('orders')
        .insert({
          order_number,
          product_id,
          customer_name,
          customer_email,
          customer_phone,
          payment_method,
          receipt_image,
          amount_paid,
          status: 'pending'
        })
        .select('*, products(title)')
        .single();
      
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, status, admin_notes } = req.body;
      
      const updates = { status, admin_notes };
      if (status === 'approved') {
        updates.approved_at = new Date().toISOString();
        // Generate secure download token (valid for 7 days)
        updates.download_token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        updates.download_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }
      
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select('*, products(title, file_url, file_name)')
        .single();
      
      if (error) throw error;
      
      // In production, send email here via Resend/Mailgun
      // For now, we return the data and frontend will show success
      
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Orders API error:', err);
    res.status(500).json({ error: err.message });
  }
}