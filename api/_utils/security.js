import crypto from 'crypto';

export function generateDownloadToken(orderId, secret) {
  const timestamp = Date.now();
  const data = `${orderId}:${timestamp}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return Buffer.from(`${orderId}:${timestamp}:${signature}`).toString('base64');
}

export function verifyDownloadToken(token, secret, maxAge = 7 * 24 * 60 * 60 * 1000) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [orderId, timestamp, signature] = decoded.split(':');
    const age = Date.now() - parseInt(timestamp);
    if (age > maxAge) return { valid: false, error: 'Token expired' };
    return { valid: true, orderId };
  } catch (err) {
    return { valid: false, error: 'Invalid token' };
  }
}