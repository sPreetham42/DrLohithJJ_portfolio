// ================================================================
// CLOUDFLARE WORKERS RUNTIME TEST: OPTIMISTIC CONCURRENCY CONTROL
// Simulates concurrent admin edits through SELF.fetch() in Cloudflare
// Workers runtime against the actual local D1 Database binding.
// ================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { applyWorkerMigrations, seedWorkerFixtures, WORKER_TEST_SESSION_RAW } from './helpers/setup';

describe('Cloudflare Workers Runtime: Optimistic Concurrency Control', () => {
  beforeAll(async () => {
    await applyWorkerMigrations(env.DB);
    await seedWorkerFixtures(env.DB);
  });

  it('handles race conditions: rejects stale version writes with HTTP 409 and avoids phantom revisions', async () => {
    // 1. Initial State: pub-j1 is at version 1
    const initialPub = (await env.DB
      .prepare('SELECT * FROM publications WHERE id = ?')
      .bind('pub-j1')
      .first()) as any;
    expect(initialPub.version).toBe(1);

    // 2. Client B executes update with version 1 -> SUCCEEDS (version becomes 2)
    const clientBPayload = {
      id: 'pub-j1',
      codeNumber: 'J1',
      title: 'Title Updated by Client B in Workers Runtime',
      authors: 'Dr. Lohith J.J.',
      venue: 'IEEE Access',
      publicationType: 'journal',
      year: 2024,
      doi: '10.1109/ACCESS.2024.3411075',
      externalUrl: 'https://doi.org/10.1109/ACCESS.2024.3411075',
      pdfAssetId: null,
      featured: true,
      published: true,
      order: 1,
      version: 1 // Valid current version
    };

    const requestB = new Request('https://drlohithjj.in/api/v1/admin/publications/pub-j1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `__Host-admin_session=${WORKER_TEST_SESSION_RAW}`,
        'X-Admin-Request': '1',
        'Sec-Fetch-Site': 'same-origin'
      },
      body: JSON.stringify(clientBPayload)
    });

    const responseB = await SELF.fetch(requestB);
    expect(responseB.status).toBe(200);
    const bodyB = (await responseB.json()) as any;
    expect(bodyB.version).toBe(2);

    // Verify D1 is at version 2 with 1 revision
    const afterB = (await env.DB
      .prepare('SELECT * FROM publications WHERE id = ?')
      .bind('pub-j1')
      .first()) as any;
    expect(afterB.version).toBe(2);
    expect(afterB.title).toBe('Title Updated by Client B in Workers Runtime');

    const revsAfterB = (await env.DB
      .prepare('SELECT * FROM revisions WHERE entity_type = ? AND entity_id = ?')
      .bind('publication', 'pub-j1')
      .all()) as any;
    expect(revsAfterB.results.length).toBe(1);
    expect(revsAfterB.results[0].version).toBe(2);

    // 3. Client A attempts update with STALE version 1 -> FAILS with HTTP 409
    const clientAPayload = {
      id: 'pub-j1',
      codeNumber: 'J1',
      title: 'Stale Title Overwrite Attempt by Client A',
      authors: 'Dr. Lohith J.J.',
      venue: 'IEEE Access',
      publicationType: 'journal',
      year: 2024,
      doi: '10.1109/ACCESS.2024.3411075',
      externalUrl: 'https://doi.org/10.1109/ACCESS.2024.3411075',
      pdfAssetId: null,
      featured: true,
      published: true,
      order: 1,
      version: 1 // STALE VERSION (Current is 2)
    };

    const requestA = new Request('https://drlohithjj.in/api/v1/admin/publications/pub-j1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `__Host-admin_session=${WORKER_TEST_SESSION_RAW}`,
        'X-Admin-Request': '1',
        'Sec-Fetch-Site': 'same-origin'
      },
      body: JSON.stringify(clientAPayload)
    });

    const responseA = await SELF.fetch(requestA);
    expect(responseA.status).toBe(409);
    const bodyA = (await responseA.json()) as any;
    expect(bodyA.error.code).toBe('CONCURRENCY_CONFLICT');

    // 4. Assert D1 was NOT corrupted: Title remains Client B's title, version is still 2
    const afterFailedA = (await env.DB
      .prepare('SELECT * FROM publications WHERE id = ?')
      .bind('pub-j1')
      .first()) as any;
    expect(afterFailedA.version).toBe(2);
    expect(afterFailedA.title).toBe('Title Updated by Client B in Workers Runtime');

    // 5. Assert ZERO phantom revisions were created
    const revsAfterFailedA = (await env.DB
      .prepare('SELECT * FROM revisions WHERE entity_type = ? AND entity_id = ?')
      .bind('publication', 'pub-j1')
      .all()) as any;
    expect(revsAfterFailedA.results.length).toBe(1); // Still exactly 1 revision
  });
});
