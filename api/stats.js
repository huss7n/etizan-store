import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      // Get orders stats
      const { data: orders } = await supabase.from('orders').select('*');
      const { data: products } = await supabase.from('products').select('*');
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const totalSales = orders?.reduce((sum, o) => o.status === 'approved' ? sum + o.amount : sum, 0) || 0;
      const totalOrders = orders?.length || 0;
      const approvedOrders = orders?.filter(o => o.status === 'approved').length || 0;
      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
      
      const monthlySales = orders?.filter(o => 
        o.status === 'approved' && new Date(o.created_at) >= thirtyDaysAgo
      ).reduce((sum, o) => sum + o.amount, 0) || 0;
      
      // Sales by category
      const salesByCategory = {};
      orders?.forEach(order => {
        const product = products?.find(p => p.id === order.product_id);
        if (product && order.status === 'approved') {
          salesByCategory[product.category] = (salesByCategory[product.category] || 0) + order.amount;
        }
      });
      
      // Daily sales for chart (last 30 days)
      const dailySales = {};
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        dailySales[dateStr] = 0;
      }
      
      orders?.forEach(order => {
        if (order.status === 'approved') {
          const dateStr = new Date(order.created_at).toISOString().split('T')[0];
          if (dailySales[dateStr] !== undefined) {
            dailySales[dateStr] += order.amount;
          }
        }
      });
      
      return res.status(200).json({
        totalSales,
        totalOrders,
        approvedOrders,
        pendingOrders,
        monthlySales,
        salesByCategory,
        dailySales: Object.entries(dailySales).map(([date, amount]) => ({ date, amount })),
        conversionRate: totalOrders > 0 ? ((approvedOrders / totalOrders) * 100).toFixed(1) : 0
      });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}