// ================================================================
// CLOUDFLARE WORKERS RUNTIME TEST: ADMIN API MUTATIONS
// Executes real HTTP PUT mutations through SELF.fetch() in Cloudflare
// Workers runtime against the actual local D1 Database binding.
// ================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applyWorkerMigrations, seedWorkerFixtures, WORKER_TEST_SESSION_RAW } from './helpers/setup';

describe('Cloudflare Workers Runtime: Admin API Mutations', () => {
  beforeAll(async () => {
    await applyWorkerMigrations(env.DB);
    await seedWorkerFixtures(env.DB);
  });

  it('PUT /api/v1/admin/publications/:id: executes atomic update, version increment, and audit logging', async () => {
    const updatedTitle = 'Advanced High-Throughput Blockchain Consensus in IoT Networks';
    const updatePayload = {
      id: 'pub-j1',
      codeNumber: 'J1',
      title: updatedTitle,
      authors: 'Dr. Lohith J.J.',
      venue: 'IEEE Transactions on Information Forensics and Security',
      publicationType: 'journal',
      year: 2025,
      doi: '10.1109/TIFS.2025.123456',
      externalUrl: 'https://doi.org/10.1109/TIFS.2025.123456',
      pdfAssetId: null,
      featured: true,
      published: true,
      order: 1,
      version: 1 // Expected current version
    };

    const request = new Request('https://drlohithjj.in/api/v1/admin/publications/pub-j1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `__Host-admin_session=${WORKER_TEST_SESSION_RAW}`,
        'X-Admin-Request': '1',
        'Sec-Fetch-Site': 'same-origin'
      },
      body: JSON.stringify(updatePayload)
    });

    const response = await SELF.fetch(request);
    expect(response.status).toBe(200);

    const body = (await response.json()) as any;
    expect(body.id).toBe('pub-j1');
    expect(body.title).toBe(updatedTitle);
    expect(body.version).toBe(2);

    // 1. Direct D1 inspection: Verify database record changed
    const dbPub = (await env.DB
      .prepare('SELECT * FROM publications WHERE id = ?')
      .bind('pub-j1')
      .first()) as any;
    expect(dbPub.title).toBe(updatedTitle);
    expect(dbPub.version).toBe(2);

    // 2. Direct D1 inspection: Verify revision audit log created
    const dbRevisions = (await env.DB
      .prepare('SELECT * FROM revisions WHERE entity_type = ? AND entity_id = ? ORDER BY version DESC')
      .bind('publication', 'pub-j1')
      .all()) as any;

    expect(dbRevisions.results.length).toBeGreaterThanOrEqual(1);
    const latestRev = dbRevisions.results[0];
    expect(latestRev.version).toBe(2);
    expect(latestRev.action).toBe('update');
    expect(latestRev.author).toBe('lohithjj@gmail.com');

    // 3. Direct Public API read-back verification
    const publicRequest = new Request('https://drlohithjj.in/api/v1/public/publications');
    const publicResponse = await SELF.fetch(publicRequest);
    expect(publicResponse.status).toBe(200);
    const publicList = (await publicResponse.json()) as any[];
    const updatedPub = publicList.find((p: any) => p.id === 'pub-j1');
    expect(updatedPub).toBeDefined();
    expect(updatedPub.title).toBe(updatedTitle);
  });
});
