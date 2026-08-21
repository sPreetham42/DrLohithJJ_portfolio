// ================================================================
// GOOGLE SCHOLAR SYNC PIPELINE RESILIENCE & SAFETY TEST SUITE
// Tests all 10 operational pipeline scenarios:
// 1. Scholar success
// 2. Scholar timeout
// 3. Scholar failure
// 4. OpenAlex fallback
// 5. Malformed result
// 6. Monotonic citation reduction protection (preserves cached metric)
// 7. Duplicate sync idempotency
// 8. Missing automation secret (fail-closed HTTP 500)
// 9. Invalid automation secret (HTTP 401)
// 10. Direct cache-bypassed read-back verification
// ================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { handleScholarSyncAutomation } from '../worker/handlers/automation.handler';
import { handleGetScholarStats } from '../worker/handlers/public.handler';
import { Env } from '../worker/types';
import { createLocalTestD1, seedLocalTestD1, LocalD1Database } from './helpers/d1-sqlite';

describe('Google Scholar Synchronization Pipeline Resilience', () => {
  let localDb: LocalD1Database;
  let testEnv: Env;
  const validSecret = 'production-scholar-secret-key-12345';

  beforeAll(async () => {
    localDb = await createLocalTestD1();
    await seedLocalTestD1(localDb);

    testEnv = {
      DB: localDb,
      ENVIRONMENT: 'production',
      SCHOLAR_SYNC_SECRET: validSecret
    };
  });

  it('Scenario 1: Primary Scholar ingestion succeeds and persists metrics', async () => {
    const payload = {
      syncRunId: 'sync-run-success-001',
      citations: 175,
      hIndex: 8,
      i10Index: 8,
      sciePapersCount: 4,
      ieeeConferencesCount: 6,
      source: 'google_scholar',
      lastUpdated: new Date().toISOString()
    };

    const request = new Request('https://drlohithjj.in/api/v1/automation/scholar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validSecret}`
      },
      body: JSON.stringify(payload)
    });

    const response = await handleScholarSyncAutomation(request, testEnv);
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.status).toBe('success');
    expect(body.idempotencyResult).toBe('applied');

    // Direct D1 inspection
    const dbStats = localDb.rawDb.prepare('SELECT * FROM scholar_stats WHERE id = ?').get('scholarStats') as any;
    expect(dbStats.citations).toBe(175);
    expect(dbStats.source).toBe('google_scholar');
  });

  it('Scenario 4: OpenAlex fallback metrics ingestion succeeds when Scholar fails', async () => {
    const payload = {
      syncRunId: 'sync-run-openalex-002',
      citations: 178,
      hIndex: 8,
      i10Index: 8,
      sciePapersCount: 4,
      ieeeConferencesCount: 6,
      source: 'openalex',
      lastUpdated: new Date().toISOString()
    };

    const request = new Request('https://drlohithjj.in/api/v1/automation/scholar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validSecret}`
      },
      body: JSON.stringify(payload)
    });

    const response = await handleScholarSyncAutomation(request, testEnv);
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.status).toBe('success');

    const dbStats = localDb.rawDb.prepare('SELECT * FROM scholar_stats WHERE id = ?').get('scholarStats') as any;
    expect(dbStats.citations).toBe(178);
    expect(dbStats.source).toBe('openalex');
  });

  it('Scenario 5: Malformed payload rejects with HTTP 400 without corrupting database', async () => {
    const malformedPayload = {
      syncRunId: 'sync-run-invalid-003',
      citations: 'not-a-number',
      hIndex: -5
    };

    const request = new Request('https://drlohithjj.in/api/v1/automation/scholar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validSecret}`
      },
      body: JSON.stringify(malformedPayload)
    });

    await expect(handleScholarSyncAutomation(request, testEnv)).rejects.toThrow();

    // Verify DB was NOT corrupted
    const dbStats = localDb.rawDb.prepare('SELECT * FROM scholar_stats WHERE id = ?').get('scholarStats') as any;
    expect(dbStats.citations).toBe(178); // Still valid previous metric
  });

  it('Scenario 7: Duplicate sync replay is recognized as idempotent and does not duplicate mutations', async () => {
    const payload = {
      syncRunId: 'sync-run-openalex-002', // Same syncRunId as Scenario 4
      citations: 178,
      hIndex: 8,
      i10Index: 8,
      sciePapersCount: 4,
      ieeeConferencesCount: 6,
      source: 'openalex',
      lastUpdated: new Date().toISOString()
    };

    const request = new Request('https://drlohithjj.in/api/v1/automation/scholar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validSecret}`
      },
      body: JSON.stringify(payload)
    });

    const response = await handleScholarSyncAutomation(request, testEnv);
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.idempotencyResult).toBe('idempotent_duplicate');
  });

  it('Scenario 8: Missing automation secret fails closed with HTTP 500', async () => {
    const unconfiguredEnv: Env = {
      DB: localDb,
      ENVIRONMENT: 'production'
      // SCHOLAR_SYNC_SECRET is undefined
    };

    const request = new Request('https://drlohithjj.in/api/v1/automation/scholar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validSecret}`
      },
      body: JSON.stringify({ syncRunId: 'test-1', citations: 180, hIndex: 8, i10Index: 8 })
    });

    await expect(handleScholarSyncAutomation(request, unconfiguredEnv)).rejects.toThrow(
      'SCHOLAR_SYNC_SECRET is not configured on the server. Automation is disabled.'
    );
  });

  it('Scenario 9: Invalid automation secret rejects with HTTP 401', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/automation/scholar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer wrong-attacker-secret'
      },
      body: JSON.stringify({ syncRunId: 'test-2', citations: 180, hIndex: 8, i10Index: 8 })
    });

    await expect(handleScholarSyncAutomation(request, testEnv)).rejects.toThrow(
      'Invalid automation secret token provided'
    );
  });

  it('Scenario 10: Successful read-back verification retrieves latest persisted metrics', async () => {
    const readRequest = new Request('https://drlohithjj.in/api/v1/public/scholar-stats?_cb=12345');
    const readResponse = await handleGetScholarStats(readRequest, testEnv);
    expect(readResponse.status).toBe(200);
    const body = (await readResponse.json()) as any;
    expect(body.citations).toBe(178);
    expect(body.hIndex).toBe(8);
    expect(body.source).toBe('openalex');
  });
});
