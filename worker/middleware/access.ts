// ================================================================
// CLOUDFLARE ACCESS JWT CRYPTOGRAPHIC VERIFICATION MIDDLEWARE
// Implements RS256 signature verification via Cloudflare Access JWKS,
// algorithm confusion protection, claims validation, and server allowlist.
// ================================================================

import { Env, AuthenticatedUser } from '../types';
import { UnauthorizedError, ForbiddenError } from '../errors';

export function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  return atob(padded);
}

export function base64UrlToUint8Array(str: string): Uint8Array {
  const binaryStr = base64UrlDecode(str);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

export function parseJwt(jwt: string): {
  header: Record<string, any>;
  payload: Record<string, any>;
  signedData: Uint8Array;
  signature: Uint8Array;
} {
  if (typeof jwt !== 'string') {
    throw new UnauthorizedError('Malformed JWT assertion: token must be a string');
  }
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new UnauthorizedError('Malformed JWT assertion: expected 3 segments');
  }

  try {
    const headerJson = decodeURIComponent(
      base64UrlDecode(parts[0])
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payloadJson = decodeURIComponent(
      base64UrlDecode(parts[1])
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const header = JSON.parse(headerJson);
    const payload = JSON.parse(payloadJson);
    const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = base64UrlToUint8Array(parts[2]);

    return { header, payload, signedData, signature };
  } catch (err: any) {
    throw new UnauthorizedError(`Failed to parse JWT assertion: ${err.message}`);
  }
}

// In-memory key cache for imported Web Crypto public keys (TTL: 1 hour)
const keyCache = new Map<string, { key: CryptoKey; cachedAt: number }>();
const KEY_CACHE_TTL_MS = 60 * 60 * 1000;

export function clearJwksKeyCache(): void {
  keyCache.clear();
}

export async function getAccessPublicKey(
  certsUrl: string,
  kid: string,
  fetcher: typeof fetch = fetch
): Promise<CryptoKey> {
  const cacheKey = `${certsUrl}:${kid}`;
  const cached = keyCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.cachedAt < KEY_CACHE_TTL_MS) {
    return cached.key;
  }

  let response: Response;
  try {
    response = await fetcher(certsUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Cloudflare-Access-JWT-Verifier'
      }
    });
  } catch (err: any) {
    throw new UnauthorizedError(`Failed to retrieve Cloudflare Access JWKS certificates: ${err.message}`);
  }

  if (!response.ok) {
    throw new UnauthorizedError(`Failed to fetch Cloudflare Access JWKS certificates (HTTP ${response.status})`);
  }

  let jwks: { keys: any[] };
  try {
    jwks = (await response.json()) as any;
  } catch {
    throw new UnauthorizedError('Invalid JSON response from Cloudflare Access JWKS endpoint');
  }

  if (!jwks || !Array.isArray(jwks.keys)) {
    throw new UnauthorizedError('Malformed JWKS certificate payload');
  }

  const keyData = jwks.keys.find((k: any) => k.kid === kid && k.kty === 'RSA');
  if (!keyData) {
    throw new UnauthorizedError(`No matching RSA public key found for kid '${kid}' in JWKS`);
  }

  let cryptoKey: CryptoKey;
  try {
    cryptoKey = await crypto.subtle.importKey(
      'jwk',
      keyData,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
  } catch (err: any) {
    throw new UnauthorizedError(`Failed to import JWKS key into Web Crypto: ${err.message}`);
  }

  keyCache.set(cacheKey, { key: cryptoKey, cachedAt: now });
  return cryptoKey;
}

export async function authenticateAdmin(
  request: Request,
  env: Env,
  jwksFetcher?: typeof fetch
): Promise<AuthenticatedUser> {
  const assertion = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!assertion) {
    throw new UnauthorizedError('Missing required Cloudflare Access assertion header (Cf-Access-Jwt-Assertion)');
  }

  const { header, payload, signedData, signature } = parseJwt(assertion);

  // 1. Algorithm Protection (Prevent alg:none or algorithm confusion)
  if (!header.alg || header.alg.toUpperCase() !== 'RS256') {
    throw new UnauthorizedError(`Unsupported JWT algorithm '${header.alg}'. Only RS256 is permitted.`);
  }

  if (!header.kid || typeof header.kid !== 'string') {
    throw new UnauthorizedError('JWT header is missing required key identifier (kid)');
  }

  // 2. Resolve JWKS URL & Verify Cryptographic Signature
  let certsUrl = env.ACCESS_CERTS_URL;
  if (!certsUrl) {
    const rawIssuer = env.ACCESS_ISSUER || payload.iss;
    if (typeof rawIssuer === 'string') {
      try {
        const issuerUrl = new URL(rawIssuer);
        if (
          issuerUrl.protocol === 'https:' &&
          issuerUrl.hostname.endsWith('.cloudflareaccess.com')
        ) {
          certsUrl = `https://${issuerUrl.hostname}/cdn-cgi/access/certs`;
        }
      } catch {
        // Invalid URL format
      }
    }
  }

  if (!certsUrl) {
    throw new UnauthorizedError(
      'Cloudflare Access verification failed: Untrusted or missing Access issuer. Must be a valid *.cloudflareaccess.com domain.'
    );
  }

  const publicKey = await getAccessPublicKey(certsUrl, header.kid, jwksFetcher);

  const isValid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    publicKey,
    signature,
    signedData
  );

  if (!isValid) {
    throw new UnauthorizedError('Invalid cryptographic signature on Cloudflare Access JWT assertion');
  }

  // 3. Expiration Verification
  const nowSec = Math.floor(Date.now() / 1000);
  if (!payload.exp || typeof payload.exp !== 'number' || payload.exp < nowSec) {
    throw new UnauthorizedError('Cloudflare Access identity assertion has expired');
  }

  // 4. Not Before Verification (nbf)
  if (payload.nbf && typeof payload.nbf === 'number' && payload.nbf > nowSec + 60) {
    throw new UnauthorizedError('Cloudflare Access identity assertion is not yet valid (nbf)');
  }

  // 5. Issuer Verification (when configured)
  if (env.ACCESS_ISSUER && payload.iss !== env.ACCESS_ISSUER) {
    throw new UnauthorizedError(`Invalid Access issuer: expected '${env.ACCESS_ISSUER}', got '${payload.iss}'`);
  }

  // 6. Audience Verification (when configured)
  if (env.ACCESS_AUDIENCE) {
    const audArray = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audArray.includes(env.ACCESS_AUDIENCE)) {
      throw new UnauthorizedError(`Invalid Access audience tag: expected '${env.ACCESS_AUDIENCE}'`);
    }
  }

  // 7. Identity & Allowlist Enforcement
  const email = payload.email || (payload.identity && payload.identity.email);
  if (!email || typeof email !== 'string') {
    throw new UnauthorizedError('Access token does not contain a valid email identity claim');
  }

  const defaultAdmin = 'lohithjj@gmail.com';
  const allowlistRaw = env.ADMIN_EMAILS || defaultAdmin;
  const allowlist = allowlistRaw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

  if (!allowlist.includes(email.toLowerCase())) {
    throw new ForbiddenError(`Email '${email}' is not in the authorized administrator allowlist`);
  }

  return {
    email: email.toLowerCase(),
    sub: payload.sub || email.toLowerCase(),
    name: payload.name || email.split('@')[0],
    rawJwt: assertion
  };
}
