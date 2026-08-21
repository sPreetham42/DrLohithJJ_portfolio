// ================================================================
// STRICT CORS SECURITY MIDDLEWARE
// Enforces an exact origin allowlist, rejects arbitrary origin suffixes
// (e.g. arbitrary .github.io sites), and protects authenticated credentials.
// ================================================================

export const ALLOWED_ORIGINS: ReadonlySet<string> = new Set([
  'https://drlohithjj.in',
  'https://www.drlohithjj.in',
  'https://spreetham42.github.io',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:8787',
  'http://localhost:8787'
]);

export function normalizeOrigin(origin: string | null): string | null {
  if (!origin) return null;
  const trimmed = origin.trim();
  if (!trimmed || trimmed === 'null') return null;
  try {
    const url = new URL(trimmed);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

export function isOriginAllowed(origin: string | null): boolean {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  return ALLOWED_ORIGINS.has(normalized);
}

export function handleCors(request: Request): {
  headers: Record<string, string>;
  isPreflight: boolean;
  originAllowed: boolean;
} {
  const rawOrigin = request.headers.get('Origin');
  const isPreflight = request.method.toUpperCase() === 'OPTIONS';
  const normalizedOrigin = normalizeOrigin(rawOrigin);
  const originAllowed = normalizedOrigin !== null && ALLOWED_ORIGINS.has(normalizedOrigin);

  const headers: Record<string, string> = {
    'Vary': 'Origin'
  };

  // Only emit CORS headers if the request origin is explicitly recognized and authorized
  if (originAllowed && normalizedOrigin) {
    headers['Access-Control-Allow-Origin'] = normalizedOrigin;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
    headers['Access-Control-Allow-Headers'] =
      'Content-Type, Authorization, Cf-Access-Jwt-Assertion, X-Requested-With, X-Admin-Request';
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Access-Control-Max-Age'] = '86400';
  }

  return { headers, isPreflight, originAllowed };
}
