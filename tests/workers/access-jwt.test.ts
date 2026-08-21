// ================================================================
// CLOUDFLARE WORKERS RUNTIME TEST: CLOUDFLARE ACCESS JWT
// Verifies RS256 JWT signature and claims validation inside the real
// Cloudflare Workers runtime using native Web Crypto APIs.
// ================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { authenticateAdmin } from '../../worker/middleware/access';
import { Env } from '../../worker/types';

describe('Cloudflare Workers Runtime: Access JWT Verification', () => {
  let keyPair: CryptoKeyPair;
  let publicJwk: JsonWebKey;
  const keyId = 'test-workers-key-1';
  const teamDomain = 'https://testteam.cloudflareaccess.com';
  const policyAud = 'workers-runtime-test-aud-12345';
  let mockEnv: Env;
  let mockJwksFetcher: typeof fetch;

  beforeAll(async () => {
    keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['sign', 'verify']
    );

    publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    publicJwk.kid = keyId;
    publicJwk.alg = 'RS256';
    publicJwk.use = 'sig';

    mockEnv = {
      DB: {} as any,
      ENVIRONMENT: 'production',
      AUTH_MODE: 'ACCESS',
      ACCESS_ISSUER: teamDomain,
      ACCESS_AUDIENCE: policyAud,
      ADMIN_EMAILS: 'lohithjj@gmail.com'
    };

    mockJwksFetcher = (async () => {
      return new Response(JSON.stringify({ keys: [publicJwk] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }) as any;
  });

  function base64UrlEncode(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  async function createSignedJwt(payload: any, headerKid = keyId): Promise<string> {
    const header = { alg: 'RS256', typ: 'JWT', kid: headerKid };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      keyPair.privateKey,
      new TextEncoder().encode(signingInput)
    );

    const sigBytes = new Uint8Array(signature);
    let sigBinary = '';
    for (let i = 0; i < sigBytes.byteLength; i++) {
      sigBinary += String.fromCharCode(sigBytes[i]);
    }
    const encodedSignature = btoa(sigBinary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${signingInput}.${encodedSignature}`;
  }

  it('successfully verifies a valid RS256 token in Workers runtime', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const payload = {
      iss: teamDomain,
      aud: [policyAud],
      sub: 'user-123',
      email: 'lohithjj@gmail.com',
      name: 'Dr. Lohith J.J.',
      iat: nowSec - 10,
      nbf: nowSec - 10,
      exp: nowSec + 3600
    };

    const token = await createSignedJwt(payload);
    const request = new Request('https://drlohithjj.in/api/v1/admin/profile', {
      headers: { 'Cf-Access-Jwt-Assertion': token }
    });

    const verified = await authenticateAdmin(request, mockEnv, mockJwksFetcher);
    expect(verified.email).toBe('lohithjj@gmail.com');
    expect(verified.name).toBe('Dr. Lohith J.J.');
  });

  it('rejects an expired token in Workers runtime', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const payload = {
      iss: teamDomain,
      aud: [policyAud],
      sub: 'user-123',
      email: 'lohithjj@gmail.com',
      iat: nowSec - 7200,
      exp: nowSec - 3600 // Expired
    };

    const token = await createSignedJwt(payload);
    const request = new Request('https://drlohithjj.in/api/v1/admin/profile', {
      headers: { 'Cf-Access-Jwt-Assertion': token }
    });

    await expect(authenticateAdmin(request, mockEnv, mockJwksFetcher)).rejects.toThrow('expired');
  });

  it('rejects a token with wrong audience in Workers runtime', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const payload = {
      iss: teamDomain,
      aud: ['wrong-aud'],
      sub: 'user-123',
      email: 'lohithjj@gmail.com',
      iat: nowSec - 10,
      exp: nowSec + 3600
    };

    const token = await createSignedJwt(payload);
    const request = new Request('https://drlohithjj.in/api/v1/admin/profile', {
      headers: { 'Cf-Access-Jwt-Assertion': token }
    });

    await expect(authenticateAdmin(request, mockEnv, mockJwksFetcher)).rejects.toThrow('audience');
  });
});
