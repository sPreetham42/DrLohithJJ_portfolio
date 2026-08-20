const ALLOWED_ORIGINS = [
  'https://drlohithjj.in',
  'https://www.drlohithjj.in',
  'https://spreetham42.github.io',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:8787'
];

export function handleCors(request) {
  const origin = request.headers.get('Origin') || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.github.io');
  const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];

  const headers = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cf-Access-Jwt-Assertion, X-Requested-With, X-Admin-Request',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };

  const isPreflight = request.method === 'OPTIONS';
  return { headers, isPreflight };
}
