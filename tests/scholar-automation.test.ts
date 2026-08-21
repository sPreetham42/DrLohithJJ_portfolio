import { describe, it, expect, vi } from 'vitest';
import {
  handleScholarSyncAutomation,
  constantTimeCompare
} from '../worker/handlers/automation.handler';
import { Env } from '../worker/types';

describe('Google Scholar Automation Endpoint Security', () => {
  const createMockDb = () => {
    const runs = new Map<string, any>();
    let stats = {
      id: 'scholarStats',
      citations: 170,
      h_index: 4,
      i10_index: 3,
      scie_papers_count: 4,
      ieee_conferences_count: 6,
      version: 1
    };

    return {
      prepare: vi.fn((sql: string) => ({
        bind: vi.fn((...args: any[]) => ({
          first: vi.fn(async () => {
            if (sql.includes('FROM scholar_sync_runs')) {
              return runs.get(args[0]) || null;
            }
            if (sql.includes('FROM scholar_stats')) {
              return stats;
            }
            return null;
          }),
          run: vi.fn(async () => {
            if (sql.includes('INSERT INTO scholar_sync_runs')) {
              runs.set(args[0], {
                sync_run_id: args[0],
                citations: args[1],
                h_index: args[2],
                i10_index: args[3],
                payload_sha256: args[4],
                status: args[5],
                created_at: args[6]
              });
              return { success: true, meta: { changes: 1 } };
            }
            if (sql.includes('UPDATE scholar_stats')) {
              stats = {
                ...stats,
                citations: args[0],
                h_index: args[1],
                i10_index: args[2],
                version: stats.version + 1
              };
              return { success: true, meta: { changes: 1 } };
            }
            return { success: true, meta: { changes: 1 } };
          })
        }))
      })),
      batch: vi.fn(async (statements: any[]) => {
        return statements.map(() => ({ success: true, meta: { changes: 1 } }));
      })
    } as unknown as D1Database;
  };

  it('verifies constantTimeCompare matches identical strings correctly', () => {
    expect(constantTimeCompare('secret-token-12345', 'secret-token-12345')).toBe(true);
    expect(constantTimeCompare('secret-token-12345', 'secret-token-wrong')).toBe(false);
    expect(constantTimeCompare('short', 'much-longer-string')).toBe(false);
  });

  it('fails closed with HTTP 500 when SCHOLAR_SYNC_SECRET is unconfigured', async () => {
    const db = createMockDb();
    const env: Env = {
      DB: db,
      ENVIRONMENT: 'production',
      SCHOLAR_SYNC_SECRET: '' // Missing secret
    };

    const request = new Request('https://drlohithjj.in/api/v1/automation/scholar', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer dev-scholar-secret-key-12345',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        syncRunId: 'sync-1',
        citations: 180,
        hIndex: 5,
        i10Index: 4
      })
    });

    await expect(handleScholarSyncAutomation(request, env)).rejects.toThrow(
      'SCHOLAR_SYNC_SECRET is not configured on the server'
    );
  });

  it('rejects missing or invalid Authorization header with 401 Unauthorized', async () => {
    const db = createMockDb();
    const env: Env = {
      DB: db,
      ENVIRONMENT: 'production',
      SCHOLAR_SYNC_SECRET: 'real-prod-secret-98765'
    };

    // Missing header
    const reqNoHeader = new Request('https://drlohithjj.in/api/v1/automation/scholar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ syncRunId: 'sync-1', citations: 180, hIndex: 5, i10Index: 4 })
    });
    await expect(handleScholarSyncAutomation(reqNoHeader, env)).rejects.toThrow(
      'Missing or malformed Authorization header'
    );

    // Wrong secret
    const reqWrongSecret = new Request('https://drlohithjj.in/api/v1/automation/scholar', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer wrong-secret-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ syncRunId: 'sync-1', citations: 180, hIndex: 5, i10Index: 4 })
    });
    await expect(handleScholarSyncAutomation(reqWrongSecret, env)).rejects.toThrow(
      'Invalid automation secret token provided'
    );
  });

  it('accepts valid automation secret and persists metrics', async () => {
    const db = createMockDb();
    const env: Env = {
      DB: db,
      ENVIRONMENT: 'production',
      SCHOLAR_SYNC_SECRET: 'real-prod-secret-98765'
    };

    const request = new Request('https://drlohithjj.in/api/v1/automation/scholar', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer real-prod-secret-98765',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        syncRunId: 'sync-run-100',
        citations: 185,
        hIndex: 5,
        i10Index: 4,
        lastUpdated: new Date().toISOString()
      })
    });

    const response = await handleScholarSyncAutomation(request, env);
    expect(response.status).toBe(200);
    const data = await response.json() as any;
    expect(data.status).toBe('success');
    expect(data.citations).toBe(185);
    expect(data.idempotencyResult).toBe('applied');
  });
});
