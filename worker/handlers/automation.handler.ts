import { Env } from '../types';
import { ScholarStatsRepository } from '../repositories/scholar.repository';
import { ScholarSyncRunRepository } from '../repositories/scholar_sync.repository';
import { UnauthorizedError, ValidationError } from '../errors';
import { getNoCacheHeaders, invalidateCache } from '../middleware/cache';
import { jsonResponse } from './public.handler';

export async function handleScholarSyncAutomation(request: Request, env: Env): Promise<Response> {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  const configuredSecret = env.SCHOLAR_SYNC_SECRET || 'dev-scholar-secret-key-12345';
  if (!token || token !== configuredSecret) {
    throw new UnauthorizedError('Invalid or missing automation secret token in Authorization header');
  }

  const body = await request.json() as any;
  const syncRunId = body.syncRunId;
  const citations = Number(body.citations);
  const hIndex = Number(body.hIndex);
  const i10Index = Number(body.i10Index);
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
          source: 'google_scholar',
          metadata: existing ? existing.metadata : null
        },
        version
      );
    }
  );

  await invalidateCache('scholar-stats', env);

  return jsonResponse({
    status: 'success',
    idempotencyResult: result.status,
    syncRunId,
    citations,
    hIndex,
    i10Index
  }, 200, getNoCacheHeaders());
}
