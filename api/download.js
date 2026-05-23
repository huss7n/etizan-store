import supabase from './_supabase.js';
import { setCorsHeaders, handleCorsPreflight } from './cors-config.js';
import { verifyDownloadToken, generateDownloadToken, checkRateLimit } from './_utils/security.js';

const DOWNLOAD_SECRET = process.env.DOWNLOAD_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  const origin = req.headers.origin;
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight(req, res);
  }
  
  // Set CORS headers
  setCorsHeaders(res, origin);

  try {
    if (req.method === 'POST') {
      const { orderId, token } = req.body;
      
      // Rate limiting - max 10 download attempts per IP per hour
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const rateLimit = checkRateLimit(`download_${clientIp}`, 10, 60 * 60 * 1000);
      if (!rateLimit.allowed) {
        return res.status(429).json({ 
          error: 'تم تجاوز الحد المسموح به من محاولات التحميل',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000 / 60)
        });
      }
      
      // Verify token if provided (new secure method)
      if (token) {
        const verification = verifyDownloadToken(token, DOWNLOAD_SECRET);
        if (!verification.valid) {
          return res.status(403).json({ error: 'رابط التحميل غير صالح أو انتهت صلاحيته' });
        }
        if (verification.orderId !== orderId) {
          return res.status(403).json({ error: 'رابط التحميل غير مطابق للطلب' });
        }
      }
      
      // Verify order exists and is approved
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, products(*)')
        .eq('id', orderId)
        .eq('status', 'approved')
        .single();
      
      if (orderError || !order) {
        return res.status(403).json({ error: 'الطلب غير موجود أو غير معتمد' });
      }
      
      // Check if download link is still valid (7 days from approval)
      const approvedDate = order.approved_at || order.updated_at || order.created_at;
      const orderDate = new Date(approvedDate);
      const now = new Date();
      const daysDiff = (now - orderDate) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 7) {
        return res.status(403).json({ 
          error: 'انتهت صلاحية رابط التحميل',
          expired: true,
          message: 'لاحقاً ، انتهت المدة المسموحة للتحميل (٧ أيام). يرجى التواصل مع الدعم.'
        });
      }
      
      // Generate new secure token for this download session
      const downloadToken = generateDownloadToken(orderId, DOWNLOAD_SECRET);
      
      // Log download attempt for audit
      await supabase.from('download_logs').insert({
        order_id: orderId,
        ip_address: clientIp,
        user_agent: req.headers['user-agent'],
        attempted_at: new Date().toISOString()
      }).catch(() => {}); // Non-blocking
      
      return res.status(200).json({ 
        downloadUrl: order.products?.file_url,
        productName: order.products?.name,
        expiresIn: Math.floor(7 - daysDiff),
        expiresAt: new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        token: downloadToken // Return new token for streaming
      });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Download API error:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء معالجة الطلب' });
  }
}