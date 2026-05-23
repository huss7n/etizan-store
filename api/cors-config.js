// CORS Configuration for Etizan Platform
const ALLOWED_ORIGINS = [
  'https://etizan-store.vercel.app',
  'https://etizan-store-git-main-huss7n.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

export function setCorsHeaders(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  return res;
}

export function handleCorsPreflight(req, res) {
  setCorsHeaders(res, req.headers.origin);
  return res.status(204).end();
}