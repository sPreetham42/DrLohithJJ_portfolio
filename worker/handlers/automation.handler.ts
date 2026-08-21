// ================================================================
// GOOGLE SCHOLAR SYNC AUTOMATION HANDLER
// Ingests automated daily metrics from GitHub Actions pipeline into D1.
// Enforces constant-time secret validation, fail-closed security, and idempotency.
// ================================================================

import { Env } from '../types';
import { ScholarStatsRepository } from '../repositories/scholar.repository';
import { ScholarSyncRunRepository } from '../repositories/scholar_sync.repository';
import { UnauthorizedError, ValidationError, ApiError } from '../errors';
import { getNoCacheHeaders, invalidateCache } from '../middleware/cache';
import { jsonResponse } from './public.handler';

export function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aLen = a.length;
  const bLen = b.length;
  let mismatch = aLen ^ bLen;
  for (let i = 0; i < Math.max(aLen, bLen); i++) {
    const charA = i < aLen ? a.charCodeAt(i) : 0;
    const charB = i < bLen ? b.charCodeAt(i) : 0;
    mismatch |= charA ^ charB;
  }
  return mismatch === 0;
}

export async function handleScholarSyncAutomation(request: Request, env: Env): Promise<Response> {
  const configuredSecret = (env.SCHOLAR_SYNC_SECRET || '').trim();

  // Fail-Closed: Never substitute a hardcoded fallback secret in production
  if (!configuredSecret) {
    throw new ApiError(
      500,
      'AUTH_CONFIG_ERROR',
      'SCHOLAR_SYNC_SECRET is not configured on the server. Automation is disabled.'
    );
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header. Expected Bearer token format.');
  }

  const token = authHeader.substring(7).trim();
  if (!token || !constantTimeCompare(token, configuredSecret)) {
    throw new UnauthorizedError('Invalid automation secret token provided');
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError('Malformed JSON payload in automation request');
  }

  const syncRunId = body.syncRunId;
  const citations = Number(body.citations);
  const hIndex = Number(body.hIndex);
  const i10Index = Number(body.i10Index);
  const source = typeof body.source === 'string' && body.source.trim() ? body.source.trim() : 'google_scholar';
  const lastUpdated = body.lastUpdated || new Date().toISOString();

  if (!syncRunId || typeof syncRunId !== 'string') {
    throw new ValidationError('Missing required syncRunId in automation payload');
  }
  if (isNaN(citations) || isNaN(hIndex) || isNaN(i10Index) || citations < 0) {
    throw new ValidationError('Invalid numeric citation metrics in automation payload');
  }

  const syncRepo = new ScholarSyncRunRepository(env.DB);
  const scholarRepo = new ScholarStatsRepository(env.DB);

  const result = await syncRepo.processSyncRun(
    syncRunId,
    { citations, h_index: hIndex, i10_index: i10Index, last_updated: lastUpdated },
    async (stats) => {
      const existing = await scholarRepo.get();
      const version = existing ? existing.version : 1;
      await scholarRepo.update(
        {
          citations: stats.citations,
          h_index: stats.h_index,
          i10_index: stats.i10_index,
          scie_papers_count: existing ? existing.scie_papers_count : 4,
          ieee_conferences_count: existing ? existing.ieee_conferences_count : 6,
          last_updated: stats.last_updated,
          source,
          metadata: existing ? existing.metadata : null
        },
        version
      );
    }
  );

  await invalidateCache('scholar-stats', env);

  return jsonResponse(
    {
      status: 'success',
      idempotencyResult: result.status,
      syncRunId,
      citations,
      hIndex,
      i10Index
    },
    200,
    getNoCacheHeaders()
  );
}
