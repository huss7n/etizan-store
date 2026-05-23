// CORS Configuration - CommonJS
const ALLOWED_ORIGINS = [
  'https://etizan-store.vercel.app',
  'https://etizan-store-git-main-huss7n.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

function checkCorsOrigin(origin) {
  return ALLOWED_ORIGINS.includes(origin) ? origin : '*';
}

function setCorsHeaders(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  return res;
}

function handleCorsPreflight(req, res) {
  setCorsHeaders(res, '');
  return res.status(204).end();
}

module.exports = { checkCorsOrigin, setCorsHeaders, handleCorsPreflight };
