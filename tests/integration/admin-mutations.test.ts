// ================================================================
// REAL WORKER + D1 INTEGRATION TEST: ADMIN MUTATIONS & AUDIT REVISIONS
// Tests real HTTP PUT mutation via Worker router, authentication middleware,
// admin handler, repository D1 batch execution, version increment,
// audit revision insertion, and public read-back verification.
// ================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { routeRequest } from '../../worker/router';
import { Env } from '../../worker/types';
import { createLocalTestD1, seedLocalTestD1, LocalD1Database } from '../helpers/d1-sqlite';
import { hashSessionToken } from '../../worker/repositories/session.repository';

describe('Real Worker + D1 Integration: Admin Mutations', () => {
  let localDb: LocalD1Database;
  let testEnv: Env;
  const rawSessionToken = 'integration-test-session-token-998877';

  beforeAll(async () => {
    localDb = await createLocalTestD1();
    await seedLocalTestD1(localDb);

    testEnv = {
      DB: localDb,
      ENVIRONMENT: 'production',
      AUTH_MODE: 'SESSION',
      ADMIN_GITHUB_USERS: '175527963,lohithjj'
    };

    // Seed valid admin session directly in local D1
    const tokenHash = await hashSessionToken(rawSessionToken);
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    localDb.rawDb.prepare(`
      INSERT INTO admin_sessions (
        id, session_token_hash, github_user_id, github_login,
        user_email, user_name, created_at, expires_at, last_used_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'test-session-1',
      tokenHash,
      175527963,
      'lohithjj',
      'lohithjj@gmail.com',
      'Dr. Lohith J.J.',
      now,
      expiresAt,
      now
    );
  });

  it('executes PUT /api/v1/admin/publications/:id with atomic revision and version increment', async () => {
    const updatedTitle = 'Advanced High-Throughput Blockchain Consensus for IoT';
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
        'Cookie': `__Host-admin_session=${rawSessionToken}`,
        'X-Admin-Request': '1',
        'Sec-Fetch-Site': 'same-origin'
      },
      body: JSON.stringify(updatePayload)
    });

    const response = await routeRequest(request, testEnv);
    expect(response.status).toBe(200);

    const body = (await response.json()) as any;
    expect(body.id).toBe('pub-j1');
    expect(body.title).toBe(updatedTitle);
    expect(body.version).toBe(2);

    // 1. Direct D1 inspection: Verify database record changed
    const dbPub = localDb.rawDb.prepare('SELECT * FROM publications WHERE id = ?').get('pub-j1') as any;
    expect(dbPub.title).toBe(updatedTitle);
    expect(dbPub.version).toBe(2);

    // 2. Direct D1 inspection: Verify revision audit log created
    const dbRevisions = localDb.rawDb
      .prepare('SELECT * FROM revisions WHERE entity_type = ? AND entity_id = ? ORDER BY version DESC')
      .all('publication', 'pub-j1') as any[];

    expect(dbRevisions.length).toBeGreaterThanOrEqual(1);
    const latestRev = dbRevisions[0];
    expect(latestRev.version).toBe(2);
    expect(latestRev.action).toBe('update');
    expect(latestRev.author).toBe('lohithjj@gmail.com');
    const parsedRevPayload = JSON.parse(latestRev.payload_json);
    expect(parsedRevPayload.title).toBe(updatedTitle);
    expect(parsedRevPayload.version).toBe(2);

    // 3. Direct Public API read-back verification
    const publicRequest = new Request('https://drlohithjj.in/api/v1/public/publications');
    const publicResponse = await routeRequest(publicRequest, testEnv);
    expect(publicResponse.status).toBe(200);
    const publicList = (await publicResponse.json()) as any[];
    const updatedPub = publicList.find((p: any) => p.id === 'pub-j1');
    expect(updatedPub).toBeDefined();
    expect(updatedPub.title).toBe(updatedTitle);
    expect(updatedPub.venue).toContain('Information Forensics and Security');
  });
});
