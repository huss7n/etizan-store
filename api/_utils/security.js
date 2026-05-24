// Security utilities for Etizan API
import crypto from 'crypto';

// Encrypt sensitive data
export function encrypt(text, secretKey) {
  if (!secretKey) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-cbc', secretKey);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt sensitive data
export function decrypt(encryptedText, secretKey) {
  if (!secretKey || !encryptedText.includes(':')) return encryptedText;
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipher('aes-256-cbc', secretKey);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Hash password with salt
export function hashPassword(password, salt = null) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

// Verify password
export function verifyPassword(password, hash, salt) {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return verifyHash === hash;
}

// Generate secure download token
export function generateDownloadToken(orderId, secret) {
  const timestamp = Date.now();
  const data = `${orderId}:${timestamp}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return Buffer.from(`${orderId}:${timestamp}:${signature}`).toString('base64');
}

// Verify download token
export function verifyDownloadToken(token, secret, maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [orderId, timestamp, signature] = decoded.split(':');
    
    // Check expiration
    const age = Date.now() - parseInt(timestamp);
    if (age > maxAge) {
      return { valid: false, error: 'Token expired' };
    }
    
    // Verify signature
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

// Rate limiting helper
const requestCounts = new Map();

export function checkRateLimit(identifier, maxRequests = 100, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Clean old entries
  for (const [key, data] of requestCounts.entries()) {
    if (data.timestamp < windowStart) {
      requestCounts.delete(key);
    }
  }
  
  // Check current count
  const current = requestCounts.get(identifier);
  if (!current || current.timestamp < windowStart) {
    requestCounts.set(identifier, { count: 1, timestamp: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: current.timestamp + windowMs };
  }
  
  current.count++;
  return { allowed: true, remaining: maxRequests - current.count };
}