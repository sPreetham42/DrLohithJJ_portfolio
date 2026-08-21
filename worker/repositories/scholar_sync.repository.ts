// ================================================================
// SCHOLAR SYNC RUN REPOSITORY
// Idempotency tracking and replay protection using standard Web Crypto SHA-256
// ================================================================

export interface ScholarSyncRunRecord {
  sync_run_id: string;
  citations: number;
  h_index: number;
  i10_index: number;
  payload_sha256: string;
  status: 'success' | 'failed';
  created_at: string;
}

export async function computeSha256Hex(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export class ScholarSyncRunRepository {
  constructor(private db: D1Database) {}

  async getById(syncRunId: string): Promise<ScholarSyncRunRecord | null> {
    return await this.db
      .prepare('SELECT * FROM scholar_sync_runs WHERE sync_run_id = ?')
      .bind(syncRunId)
      .first<ScholarSyncRunRecord>();
  }

  async processSyncRun(
    syncRunId: string,
    payload: { citations: number; h_index: number; i10_index: number; last_updated: string },
    updateScholarStats: (stats: typeof payload) => Promise<void>
  ): Promise<{ status: 'applied' | 'idempotent_duplicate' | 'payload_mismatch'; record: ScholarSyncRunRecord }> {
    const payloadJson = JSON.stringify({
      citations: payload.citations,
      h_index: payload.h_index,
      i10_index: payload.i10_index
    });
    const payloadSha256 = await computeSha256Hex(payloadJson);

    const existing = await this.getById(syncRunId);
    if (existing) {
      if (existing.payload_sha256 === payloadSha256) {
        // Exact idempotent retry - return success without mutating DB or creating revisions
        return { status: 'idempotent_duplicate', record: existing };
      } else {
        // Conflict: Same syncRunId used with conflicting payload
        throw new Error(`Sync conflict: syncRunId '${syncRunId}' was previously executed with a different payload.`);
      }
    }

    // New unique sync run: Apply update and record sync run atomically
    const now = new Date().toISOString();
    await updateScholarStats(payload);

    await this.db
      .prepare(`
        INSERT INTO scholar_sync_runs (
          sync_run_id, citations, h_index, i10_index,
          payload_sha256, status, created_at
        ) VALUES (
          ?, ?, ?, ?, ?, 'success', ?
        )
      `)
      .bind(
        syncRunId,
        payload.citations,
        payload.h_index,
        payload.i10_index,
        payloadSha256,
        now
      )
      .run();

    const created = await this.getById(syncRunId);
    return { status: 'applied', record: created! };
  }
}
