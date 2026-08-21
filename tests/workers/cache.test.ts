// ================================================================
// CLOUDFLARE WORKERS RUNTIME TEST: CACHE & RESPONSE HEADERS
// Verifies edge cache directives (s-maxage, stale-while-revalidate,
// Cache-Tag, no-cache headers) returned by the Worker.
// ================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applyWorkerMigrations, seedWorkerFixtures, WORKER_TEST_SESSION_RAW } from './helpers/setup';

describe('Cloudflare Workers Runtime: Cache Directives & Headers', () => {
  beforeAll(async () => {
    await applyWorkerMigrations(env.DB);
    await seedWorkerFixtures(env.DB);
  });

  it('verifies public endpoints emit s-maxage=120 and stale-while-revalidate=300', async () => {
    const endpoints = [
      { path: '/api/v1/public/profile', tag: 'profile' },
      { path: '/api/v1/public/publications', tag: 'publications' },
      { path: '/api/v1/public/talks', tag: 'talks' },
      { path: '/api/v1/public/scholar-stats', tag: 'scholar-stats' }
    ];

    for (const { path, tag } of endpoints) {
      const response = await SELF.fetch(new Request(`https://drlohithjj.in${path}`));
      expect(response.status).toBe(200);

      const cacheControl = response.headers.get('Cache-Control') || '';
      expect(cacheControl).toContain('public');
      expect(cacheControl).toContain('s-maxage=120');
      expect(cacheControl).toContain('stale-while-revalidate=300');
      expect(response.headers.get('Cache-Tag')).toBe(tag);
    }
  });

  it('verifies admin endpoints emit strict no-cache directives', async () => {
    const response = await SELF.fetch(
      new Request('https://drlohithjj.in/api/v1/admin/profile', {
        headers: {
          'Cookie': `__Host-admin_session=${WORKER_TEST_SESSION_RAW}`
        }
      })
    );

    expect(response.status).toBe(200);
    const cacheControl = response.headers.get('Cache-Control') || '';
    expect(cacheControl).toContain('no-store');
    expect(cacheControl).toContain('no-cache');
    expect(response.headers.get('Pragma')).toBe('no-cache');
  });
});
