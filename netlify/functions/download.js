import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DOWNLOAD_SECRET = process.env.DOWNLOAD_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;

function verifyDownloadToken(token, secret, maxAge = 7 * 24 * 60 * 60 * 1000) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [orderId, timestamp, signature] = decoded.split(':');
    
    const age = Date.now() - parseInt(timestamp);
    if (age > maxAge) {
      return { valid: false, error: 'Token expired' };
    }
    
    const data = `${orderId}:${timestamp}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('hex');
    
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    return { valid: true, orderId };
  } catch (err) {
    return { valid: false, error: 'Invalid token' };
  }
}

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const { orderId, token } = JSON.parse(event.body);
    
    if (token) {
      const verification = verifyDownloadToken(token, DOWNLOAD_SECRET);
      if (!verification.valid) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Invalid token' }) };
      }
    }
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, products(*)')
      .eq('id', orderId)
      .eq('status', 'approved')
      .single();
    
    if (orderError || !order) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Order not found' }) };
    }
    
    const approvedDate = new Date(order.approved_at || order.updated_at || order.created_at);
    const daysDiff = (Date.now() - approvedDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 7) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Download expired' }) };
    }
    
    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({
        downloadUrl: order.products?.file_url,
        productName: order.products?.name,
        expiresIn: Math.floor(7 - daysDiff)
      })
    };
  } catch (err) {
    console.error('Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};