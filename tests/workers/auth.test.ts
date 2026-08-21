// ================================================================
// CLOUDFLARE WORKERS RUNTIME TEST: AUTH, CORS & CSRF
// Tests session authentication, CSRF protections, and CORS behavior
// through SELF.fetch() in the Cloudflare Workers runtime.
// ================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applyWorkerMigrations, seedWorkerFixtures, WORKER_TEST_SESSION_RAW } from './helpers/setup';

describe('Cloudflare Workers Runtime: Authentication & CORS/CSRF', () => {
  beforeAll(async () => {
    await applyWorkerMigrations(env.DB);
    await seedWorkerFixtures(env.DB);
  });

  it('rejects unauthenticated admin requests with HTTP 401', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/admin/profile');
    const response = await SELF.fetch(request);
    expect(response.status).toBe(401);
  });

  it('rejects invalid or forged session cookie with HTTP 401', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/admin/profile', {
      headers: {
        'Cookie': '__Host-admin_session=invalid-forged-token-xyz'
      }
    });
    const response = await SELF.fetch(request);
    expect(response.status).toBe(401);
  });

  it('accepts valid session cookie for admin GET request', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/admin/profile', {
      headers: {
        'Cookie': `__Host-admin_session=${WORKER_TEST_SESSION_RAW}`
      }
    });
    const response = await SELF.fetch(request);
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.name).toBe('Dr. Lohith J.J.');
  });

  it('rejects state-changing admin request if X-Admin-Request is missing', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/admin/publications/pub-j1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `__Host-admin_session=${WORKER_TEST_SESSION_RAW}`,
        // Missing X-Admin-Request and Sec-Fetch-Site
      },
      body: JSON.stringify({ version: 1, title: 'Test' })
    });
    const response = await SELF.fetch(request);
    expect(response.status).toBe(403);
    const body = (await response.json()) as any;
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('handles CORS: allows trusted production origin https://drlohithjj.in', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/public/profile', {
      headers: {
        'Origin': 'https://drlohithjj.in'
      }
    });
    const response = await SELF.fetch(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://drlohithjj.in');
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });

  it('handles CORS: rejects untrusted origins by not returning credentialed headers', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/public/profile', {
      headers: {
        'Origin': 'https://evil.com'
      }
    });
    const response = await SELF.fetch(request);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('handles CORS preflight OPTIONS request with HTTP 204', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/admin/profile', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://drlohithjj.in',
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'Content-Type, X-Admin-Request'
      }
    });
    const response = await SELF.fetch(request);
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://drlohithjj.in');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('PUT');
  });
});
