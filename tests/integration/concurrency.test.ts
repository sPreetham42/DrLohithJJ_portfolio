// ================================================================
// REAL WORKER + D1 INTEGRATION TEST: OPTIMISTIC CONCURRENCY CONTROL
// Simulates concurrent admin edits on real D1 SQLite database to verify
// version conflicts, HTTP 409 status, zero phantom revisions, and recovery.
// ================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { routeRequest } from '../../worker/router';
import { Env } from '../../worker/types';
import { createLocalTestD1, seedLocalTestD1, LocalD1Database } from '../helpers/d1-sqlite';
import { hashSessionToken } from '../../worker/repositories/session.repository';

describe('Real Worker + D1 Integration: Optimistic Concurrency Locking', () => {
  let localDb: LocalD1Database;
  let testEnv: Env;
  const rawSessionToken = 'concurrency-test-session-token-776655';

  beforeAll(async () => {
    localDb = await createLocalTestD1();
    await seedLocalTestD1(localDb);

    testEnv = {
      DB: localDb,
      ENVIRONMENT: 'production',
      AUTH_MODE: 'SESSION',
      ADMIN_GITHUB_USERS: '175527963,lohithjj'
    };

    const tokenHash = await hashSessionToken(rawSessionToken);
    const now = new Date().toISOString();
    localDb.rawDb.prepare(`
      INSERT INTO admin_sessions (
        id, session_token_hash, github_user_id, github_login,
        user_email, user_name, created_at, expires_at, last_used_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'concurrency-sess-1',
      tokenHash,
      175527963,
      'lohithjj',
      'lohithjj@gmail.com',
      'Dr. Lohith J.J.',
      now,
      new Date(Date.now() + 3600000).toISOString(),
      now
    );
  });

  it('handles race conditions by rejecting stale versions with HTTP 409 and preventing phantom revisions', async () => {
    // 1. Initial State: pub-j1 is at version 1
    const initialPub = localDb.rawDb.prepare('SELECT * FROM publications WHERE id = ?').get('pub-j1') as any;
    expect(initialPub.version).toBe(1);

    // 2. Admin B executes update with version 1 -> SUCCEEDS (version becomes 2)
    const adminBPayload = {
      id: 'pub-j1',
      codeNumber: 'J1',
      title: 'Title Updated by Admin B',
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
        'Cookie': `__Host-admin_session=${rawSessionToken}`,
        'X-Admin-Request': '1',
        'Sec-Fetch-Site': 'same-origin'
      },
      body: JSON.stringify(adminBPayload)
    });

    const responseB = await routeRequest(requestB, testEnv);
    expect(responseB.status).toBe(200);
    const bodyB = (await responseB.json()) as any;
    expect(bodyB.version).toBe(2);

    // Assert D1 is at version 2 with 1 revision
    const afterB = localDb.rawDb.prepare('SELECT * FROM publications WHERE id = ?').get('pub-j1') as any;
    expect(afterB.version).toBe(2);
    expect(afterB.title).toBe('Title Updated by Admin B');

    const revsAfterB = localDb.rawDb
      .prepare('SELECT * FROM revisions WHERE entity_type = ? AND entity_id = ?')
      .all('publication', 'pub-j1') as any[];
    expect(revsAfterB.length).toBe(1);
    expect(revsAfterB[0].version).toBe(2);

    // 3. Admin A attempts update with STALE version 1 -> FAILS with HTTP 409
    const adminAPayload = {
      id: 'pub-j1',
      codeNumber: 'J1',
      title: 'Stale Title Overwrite Attempt by Admin A',
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
        'Cookie': `__Host-admin_session=${rawSessionToken}`,
        'X-Admin-Request': '1',
        'Sec-Fetch-Site': 'same-origin'
      },
      body: JSON.stringify(adminAPayload)
    });

    const responseA = await routeRequest(requestA, testEnv);
    expect(responseA.status).toBe(409);
    const bodyA = (await responseA.json()) as any;
    expect(bodyA.error.code).toBe('CONCURRENCY_CONFLICT');

    // 4. Assert D1 was NOT corrupted: Title remains Admin B's title, version is still 2
    const afterFailedA = localDb.rawDb.prepare('SELECT * FROM publications WHERE id = ?').get('pub-j1') as any;
    expect(afterFailedA.version).toBe(2);
    expect(afterFailedA.title).toBe('Title Updated by Admin B');

    // 5. Assert ZERO phantom revisions were created
    const revsAfterFailedA = localDb.rawDb
      .prepare('SELECT * FROM revisions WHERE entity_type = ? AND entity_id = ?')
      .all('publication', 'pub-j1') as any[];
    expect(revsAfterFailedA.length).toBe(1); // Still exactly 1 revision

    // 6. Admin A re-fetches latest version (2) and successfully updates with version 2 -> version becomes 3
    const adminARetryPayload = {
      ...adminAPayload,
      title: 'Resolved Title by Admin A',
      version: 2 // Updated with latest version
    };

    const requestARetry = new Request('https://drlohithjj.in/api/v1/admin/publications/pub-j1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `__Host-admin_session=${rawSessionToken}`,
        'X-Admin-Request': '1',
        'Sec-Fetch-Site': 'same-origin'
      },
      body: JSON.stringify(adminARetryPayload)
    });

    const responseARetry = await routeRequest(requestARetry, testEnv);
    expect(responseARetry.status).toBe(200);
    const bodyARetry = (await responseARetry.json()) as any;
    expect(bodyARetry.version).toBe(3);

    const finalPub = localDb.rawDb.prepare('SELECT * FROM publications WHERE id = ?').get('pub-j1') as any;
    expect(finalPub.version).toBe(3);
    expect(finalPub.title).toBe('Resolved Title by Admin A');

    const finalRevs = localDb.rawDb
      .prepare('SELECT * FROM revisions WHERE entity_type = ? AND entity_id = ? ORDER BY version ASC')
      .all('publication', 'pub-j1') as any[];
    expect(finalRevs.length).toBe(2);
    expect(finalRevs[0].version).toBe(2);
    expect(finalRevs[1].version).toBe(3);
  });
});
