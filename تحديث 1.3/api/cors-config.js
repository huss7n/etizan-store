// CORS Configuration for Etizan Platform
// Allowed origins - Update this when moving to custom domain
const ALLOWED_ORIGINS = [
  'https://etizan-store.vercel.app',
  'https://etizan-store-git-main-huss7n.vercel.app',
  'https://etizan-store-huss7n.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

export function checkCorsOrigin(origin) {
  // In production, check against allowed list
  if (process.env.NODE_ENV === 'production') {
    return ALLOWED_ORIGINS.includes(origin) ? origin : null;
  }
  // In development, allow all
  return origin || '*';
}

export function setCorsHeaders(res, origin) {
  const allowedOrigin = checkCorsOrigin(origin);
  
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  return res;
}

export function handleCorsPreflight(req, res) {
  const origin = req.headers.origin;
  setCorsHeaders(res, origin);
  return res.status(204).end();
}