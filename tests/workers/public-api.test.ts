// ================================================================
// CLOUDFLARE WORKERS RUNTIME TEST: PUBLIC API
// Executes real HTTP requests through SELF.fetch() in the Cloudflare
// Workers runtime against the actual local D1 Database binding.
// ================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applyWorkerMigrations, seedWorkerFixtures } from './helpers/setup';

describe('Cloudflare Workers Runtime: Public API Endpoints', () => {
  beforeAll(async () => {
    await applyWorkerMigrations(env.DB);
    await seedWorkerFixtures(env.DB);
  });

  it('GET /api/v1/public/profile: resolves real D1 profile data with edge cache headers', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/public/profile');
    const response = await SELF.fetch(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=120');
    expect(response.headers.get('Cache-Control')).toContain('stale-while-revalidate=300');
    expect(response.headers.get('Cache-Tag')).toBe('profile');

    const body = (await response.json()) as any;
    expect(body.name).toBe('Dr. Lohith J.J.');
    expect(body.yearsExperience).toBe(20);
    expect(body.emailPrimary).toBe('lohithjj@gmail.com');
    expect(Array.isArray(body.additionalRoles)).toBe(true);
    expect(Array.isArray(body.professionalMemberships)).toBe(true);
  });

  it('GET /api/v1/public/publications: queries real D1 and returns filtered published items', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/public/publications');
    const response = await SELF.fetch(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Tag')).toBe('publications');

    const list = (await response.json()) as any[];
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);

    const pub = list.find((p) => p.id === 'pub-j1');
    expect(pub).toBeDefined();
    expect(pub.codeNumber).toBe('J1');
    expect(pub.title).toContain('Ethereum Smart Contracts');
    expect(pub.publicationType).toBe('journal');
    expect(pub.year).toBe(2024);
  });

  it('GET /api/v1/public/talks: queries real D1 talks catalog', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/public/talks');
    const response = await SELF.fetch(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Tag')).toBe('talks');

    const list = (await response.json()) as any[];
    expect(Array.isArray(list)).toBe(true);
    const talk = list.find((t) => t.id === 'talk-1');
    expect(talk).toBeDefined();
    expect(talk.title).toContain('Smart Contract Security');
  });

  it('GET /api/v1/public/scholar-stats: queries real D1 scholar metrics', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/public/scholar-stats');
    const response = await SELF.fetch(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Tag')).toBe('scholar-stats');

    const stats = (await response.json()) as any;
    expect(stats.citations).toBe(172);
    expect(stats.hIndex).toBe(8);
    expect(stats.i10Index).toBe(8);
    expect(stats.source).toBe('google_scholar');
  });
});
