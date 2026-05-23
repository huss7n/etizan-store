const supabase = require('./_supabase.js').default || require('./_supabase.js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const { orderId } = req.body;
      
      const { data: order, error } = await supabase
        .from('orders')
        .select('*, products(*)')
        .eq('id', orderId)
        .eq('status', 'approved')
        .single();
      
      if (error || !order) {
        return res.status(403).json({ error: 'الطلب غير موجود' });
      }
      
      const orderDate = new Date(order.approved_at || order.created_at);
      const daysDiff = (new Date() - orderDate) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 7) {
        return res.status(403).json({ error: 'انتهت صلاحية التحميل' });
      }
      
      return res.status(200).json({ 
        downloadUrl: order.products?.file_url,
        productName: order.products?.name,
        expiresIn: Math.floor(7 - daysDiff)
      });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
};
