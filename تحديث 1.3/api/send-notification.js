import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const { type, orderData } = req.body;
      
      // Get admin settings
      const { data: settings } = await supabase.from('settings').select('*').single();
      
      if (type === 'new_order') {
        // Send WhatsApp notification (simulated - would integrate with real API)
        const whatsappMessage = `طلب جديد من ${orderData.customer_name}\n` +
          `رقم الطلب: ${orderData.order_number}\n` +
          `المنتج: ${orderData.product_name}\n` +
          `المبلغ: ${orderData.amount.toLocaleString()} د.ع`;
        
        console.log('WhatsApp notification:', whatsappMessage);
        
        // Return success (in production, integrate with actual email/WhatsApp API)
        return res.status(200).json({ 
          success: true, 
          message: 'Notification sent',
          whatsappUrl: `https://wa.me/${settings?.whatsapp_number}?text=${encodeURIComponent(whatsappMessage)}`
        });
      }
      
      return res.status(400).json({ error: 'Invalid notification type' });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}