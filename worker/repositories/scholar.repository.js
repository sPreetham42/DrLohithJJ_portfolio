import { ConcurrencyConflictError } from '../errors.js';

export class ScholarStatsRepository {
  constructor(db) {
    this.db = db;
  }

  async get() {
    return await this.db
      .prepare('SELECT * FROM scholar_stats WHERE id = ?')
      .bind('scholarStats')
      .first();
  }

  async update(data, expectedVersion) {
    const now = new Date().toISOString();

    const result = await this.db
      .prepare(`
        UPDATE scholar_stats SET
          citations = ?,
          h_index = ?,
          i10_index = ?,
          scie_papers_count = ?,
          ieee_conferences_count = ?,
          last_updated = ?,
          source = ?,
          version = version + 1,
          updated_at = ?,
          metadata = ?
        WHERE id = 'scholarStats' AND version = ?
      `)
      .bind(
        data.citations,
        data.h_index,
        data.i10_index,
        data.scie_papers_count,
        data.ieee_conferences_count,
        data.last_updated,
        data.source || 'google_scholar',
        now,
        data.metadata || null,
        expectedVersion
      )
      .run();

    if (!result.success || result.meta.changes === 0) {
      throw new ConcurrencyConflictError('scholarStats', 'scholarStats', expectedVersion);
    }

    const updated = await this.get();
    if (!updated) throw new Error('Failed to retrieve updated scholarStats');
    return updated;
  }
}
