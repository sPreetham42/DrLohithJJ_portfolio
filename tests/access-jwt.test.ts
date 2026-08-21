import { describe, it, expect, beforeEach } from 'vitest';
import {
  authenticateAdmin,
  parseJwt,
  clearJwksKeyCache,
  base64UrlDecode
} from '../worker/middleware/access';
import { Env } from '../worker/types';

// Helper to export an RSA CryptoKey to JWK
async function exportJwk(key: CryptoKey, kid: string): Promise<any> {
  const jwk = await crypto.subtle.exportKey('jwk', key);
  return { ...jwk, kid, alg: 'RS256', use: 'sig' };
}

// Helper to construct and sign a mock JWT with Web Crypto
async function createMockJwt(
  header: Record<string, any>,
  payload: Record<string, any>,
  privateKey?: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const b64Header = btoa(JSON.stringify(header))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const b64Payload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const dataToSign = `${b64Header}.${b64Payload}`;

  if (!privateKey) {
    return `${dataToSign}.fake-signature-bytes`;
  }

  const sigBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encoder.encode(dataToSign)
  );

  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${dataToSign}.${sigBase64}`;
}

describe('Cloudflare Access JWT Cryptographic Verification', () => {
  let keyPair: CryptoKeyPair;
  let kid: string;
  let mockJwksResponse: { keys: any[] };

  beforeEach(async () => {
    clearJwksKeyCache();
    kid = 'test-access-kid-1';

    // Generate ephemeral 2048-bit RSA key pair for testing
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

    const publicJwk = await exportJwk(keyPair.publicKey, kid);
    mockJwksResponse = { keys: [publicJwk] };
  });

  const mockFetcher = (certsUrl: string): Promise<Response> => {
    return Promise.resolve(new Response(JSON.stringify(mockJwksResponse), { status: 200 }));
  };

  const createBaseEnv = (): Env => ({
    DB: {} as any,
    ENVIRONMENT: 'production',
    ACCESS_ISSUER: 'https://test-team.cloudflareaccess.com',
    ACCESS_AUDIENCE: 'test-aud-12345',
    ADMIN_EMAILS: 'lohithjj@gmail.com'
  });

  it('validates a valid RS256 JWT with matching signature and claims', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const token = await createMockJwt(
      { alg: 'RS256', kid, typ: 'JWT' },
      {
        iss: 'https://test-team.cloudflareaccess.com',
        aud: ['test-aud-12345'],
        email: 'lohithjj@gmail.com',
        exp: nowSec + 3600,
        sub: 'user-123'
      },
      keyPair.privateKey
    );

    const request = new Request('https://drlohithjj.in/api/v1/admin/profile', {
      headers: { 'Cf-Access-Jwt-Assertion': token }
    });

    const user = await authenticateAdmin(request, createBaseEnv(), mockFetcher as any);
    expect(user.email).toBe('lohithjj@gmail.com');
    expect(user.sub).toBe('user-123');
  });

  it('rejects an unverified forged signature', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const otherKeyPair = await crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['sign', 'verify']
    );

    // Sign with untrusted private key
    const forgedToken = await createMockJwt(
      { alg: 'RS256', kid, typ: 'JWT' },
      {
        iss: 'https://test-team.cloudflareaccess.com',
        aud: ['test-aud-12345'],
        email: 'lohithjj@gmail.com',
        exp: nowSec + 3600
      },
      otherKeyPair.privateKey
    );

    const request = new Request('https://drlohithjj.in/api/v1/admin/profile', {
      headers: { 'Cf-Access-Jwt-Assertion': forgedToken }
    });

    await expect(
      authenticateAdmin(request, createBaseEnv(), mockFetcher as any)
    ).rejects.toThrow('Invalid cryptographic signature');
  });

  it('rejects expired JWTs', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const expiredToken = await createMockJwt(
      { alg: 'RS256', kid, typ: 'JWT' },
      {
        iss: 'https://test-team.cloudflareaccess.com',
        aud: ['test-aud-12345'],
        email: 'lohithjj@gmail.com',
        exp: nowSec - 60 // expired 1 minute ago
      },
      keyPair.privateKey
    );

    const request = new Request('https://drlohithjj.in/api/v1/admin/profile', {
      headers: { 'Cf-Access-Jwt-Assertion': expiredToken }
    });

    await expect(
      authenticateAdmin(request, createBaseEnv(), mockFetcher as any)
    ).rejects.toThrow('expired');
  });

  it('rejects algorithm confusion (e.g. alg: none or HS256)', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const noneAlgToken = await createMockJwt(
      { alg: 'none', kid, typ: 'JWT' },
      {
        iss: 'https://test-team.cloudflareaccess.com',
        aud: ['test-aud-12345'],
        email: 'lohithjj@gmail.com',
        exp: nowSec + 3600
      }
    );

    const request = new Request('https://drlohithjj.in/api/v1/admin/profile', {
      headers: { 'Cf-Access-Jwt-Assertion': noneAlgToken }
    });

    await expect(
      authenticateAdmin(request, createBaseEnv(), mockFetcher as any)
    ).rejects.toThrow("Unsupported JWT algorithm 'none'");
  });

  it('rejects unlisted emails not in allowlist (403 Forbidden)', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const token = await createMockJwt(
      { alg: 'RS256', kid, typ: 'JWT' },
      {
        iss: 'https://test-team.cloudflareaccess.com',
        aud: ['test-aud-12345'],
        email: 'attacker@evil.com',
        exp: nowSec + 3600
      },
      keyPair.privateKey
    );

    const request = new Request('https://drlohithjj.in/api/v1/admin/profile', {
      headers: { 'Cf-Access-Jwt-Assertion': token }
    });

    await expect(
      authenticateAdmin(request, createBaseEnv(), mockFetcher as any)
    ).rejects.toThrow('authorized administrator allowlist');
  });

  it('rejects mismatched audience tags', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const token = await createMockJwt(
      { alg: 'RS256', kid, typ: 'JWT' },
      {
        iss: 'https://test-team.cloudflareaccess.com',
        aud: ['different-aud-tag'],
        email: 'lohithjj@gmail.com',
        exp: nowSec + 3600
      },
      keyPair.privateKey
    );

    const request = new Request('https://drlohithjj.in/api/v1/admin/profile', {
      headers: { 'Cf-Access-Jwt-Assertion': token }
    });

    await expect(
      authenticateAdmin(request, createBaseEnv(), mockFetcher as any)
    ).rejects.toThrow('Invalid Access audience tag');
  });

  it('rejects when JWKS fetch fails', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const token = await createMockJwt(
      { alg: 'RS256', kid, typ: 'JWT' },
      {
        iss: 'https://test-team.cloudflareaccess.com',
        aud: ['test-aud-12345'],
        email: 'lohithjj@gmail.com',
        exp: nowSec + 3600
      },
      keyPair.privateKey
    );

    const failingFetcher = () => Promise.reject(new Error('Network connection timeout'));
    const request = new Request('https://drlohithjj.in/api/v1/admin/profile', {
      headers: { 'Cf-Access-Jwt-Assertion': token }
    });

    await expect(
      authenticateAdmin(request, createBaseEnv(), failingFetcher as any)
    ).rejects.toThrow('Failed to retrieve Cloudflare Access JWKS certificates');
  });

  it('rejects untrusted third-party issuer URLs to prevent SSRF and JWKS spoofing', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const token = await createMockJwt(
      { alg: 'RS256', kid, typ: 'JWT' },
      {
        iss: 'https://evil-attacker.com',
        aud: ['test-aud-12345'],
        email: 'lohithjj@gmail.com',
        exp: nowSec + 3600
      },
      keyPair.privateKey
    );

    const envWithoutIssuer: Env = {
      DB: {} as any,
      ENVIRONMENT: 'production',
      ADMIN_EMAILS: 'lohithjj@gmail.com'
    };

    const request = new Request('https://drlohithjj.in/api/v1/admin/profile', {
      headers: { 'Cf-Access-Jwt-Assertion': token }
    });

    await expect(
      authenticateAdmin(request, envWithoutIssuer, mockFetcher as any)
    ).rejects.toThrow('Untrusted or missing Access issuer');
  });

  it('rejects tokens with future nbf (not before) claim', async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const token = await createMockJwt(
      { alg: 'RS256', kid, typ: 'JWT' },
      {
        iss: 'https://test-team.cloudflareaccess.com',
        aud: ['test-aud-12345'],
        email: 'lohithjj@gmail.com',
        exp: nowSec + 3600,
        nbf: nowSec + 300 // Valid in 5 minutes
      },
      keyPair.privateKey
    );

    const request = new Request('https://drlohithjj.in/api/v1/admin/profile', {
      headers: { 'Cf-Access-Jwt-Assertion': token }
    });

    await expect(
      authenticateAdmin(request, createBaseEnv(), mockFetcher as any)
    ).rejects.toThrow('not yet valid (nbf)');
  });
});
