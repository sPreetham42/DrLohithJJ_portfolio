import { UnauthorizedError, ForbiddenError } from '../errors.js';

export function parseJwtPayload(jwt) {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new UnauthorizedError('Malformed JWT assertion: expected 3 segments');
  }
  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    throw new UnauthorizedError(`Failed to decode JWT payload: ${err.message}`);
  }
}

export async function authenticateAdmin(request, env) {
  const assertion = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!assertion) {
    throw new UnauthorizedError('Missing required Cloudflare Access assertion header (Cf-Access-Jwt-Assertion)');
  }

  const payload = parseJwtPayload(assertion);

  // 1. Expiration Verification
  if (payload.exp && typeof payload.exp === 'number') {
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp < nowSec) {
      throw new UnauthorizedError('Cloudflare Access identity assertion has expired');
    }
  }

  // 2. Issuer Verification (when configured)
  if (env.ACCESS_ISSUER && payload.iss && payload.iss !== env.ACCESS_ISSUER) {
    throw new UnauthorizedError(`Invalid Access issuer: expected '${env.ACCESS_ISSUER}', got '${payload.iss}'`);
  }

  // 3. Audience Verification (when configured)
  if (env.ACCESS_AUDIENCE && payload.aud) {
    const audArray = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audArray.includes(env.ACCESS_AUDIENCE)) {
      throw new UnauthorizedError(`Invalid Access audience tag: expected '${env.ACCESS_AUDIENCE}'`);
    }
  }

  // 4. Extract Identity Email
  const email = payload.email || (payload.identity && payload.identity.email);
  if (!email || typeof email !== 'string') {
    throw new UnauthorizedError('Access token does not contain a valid email identity claim');
  }

  // 5. Server-side Email Allowlist Enforcement
  const defaultAdmin = 'lohithjj@gmail.com';
  const allowlistRaw = env.ADMIN_EMAILS || defaultAdmin;
  const allowlist = allowlistRaw.split(',').map(e => e.trim().toLowerCase());

  if (!allowlist.includes(email.toLowerCase())) {
    throw new ForbiddenError(`Email '${email}' is not in the authorized administrator allowlist`);
  }

  return {
    email: email.toLowerCase(),
    sub: payload.sub,
    name: payload.name,
    rawJwt: assertion
  };
}
