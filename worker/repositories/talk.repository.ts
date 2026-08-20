import { TalkRecord } from '../types';
import { ConcurrencyConflictError } from '../errors';

export class TalkRepository {
  constructor(private db: D1Database) {}

  async getAllPublic(year?: number | null): Promise<TalkRecord[]> {
    if (year && !isNaN(year)) {
      const { results } = await this.db
        .prepare('SELECT * FROM talks WHERE published = 1 AND year = ? ORDER BY display_order ASC')
        .bind(year)
        .all<TalkRecord>();
      return results || [];
    }
    const { results } = await this.db
      .prepare('SELECT * FROM talks WHERE published = 1 ORDER BY year DESC, display_order ASC')
      .all<TalkRecord>();
    return results || [];
  }

  async getById(id: string): Promise<TalkRecord | null> {
    return await this.db
      .prepare('SELECT * FROM talks WHERE id = ?')
      .bind(id)
      .first<TalkRecord>();
  }

  async create(data: Omit<TalkRecord, 'version' | 'created_at' | 'updated_at'>): Promise<TalkRecord> {
    const now = new Date().toISOString();
    await this.db
      .prepare(`
        INSERT INTO talks (
          id, title, venue, date_string, year, featured, published,
          display_order, version, created_at, updated_at, metadata
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?
        )
      `)
      .bind(
        data.id,
        data.title,
        data.venue,
        data.date_string,
        data.year,
        data.featured ? 1 : 0,
        data.published ? 1 : 0,
        data.display_order,
        now,
        now,
        data.metadata || null
      )
      .run();

    const created = await this.getById(data.id);
    if (!created) throw new Error(`Failed to create talk ${data.id}`);
    return created;
  }

  async update(
    id: string,
    data: Omit<TalkRecord, 'id' | 'version' | 'created_at' | 'updated_at'>,
    expectedVersion: number
  ): Promise<TalkRecord> {
    const now = new Date().toISOString();
    const result = await this.db
      .prepare(`
        UPDATE talks SET
          title = ?,
          venue = ?,
          date_string = ?,
          year = ?,
          featured = ?,
          published = ?,
          display_order = ?,
          version = version + 1,
          updated_at = ?,
          metadata = ?
        WHERE id = ? AND version = ?
      `)
      .bind(
        data.title,
        data.venue,
        data.date_string,
        data.year,
        data.featured ? 1 : 0,
        data.published ? 1 : 0,
        data.display_order,
        now,
        data.metadata || null,
        id,
        expectedVersion
      )
      .run();

    if (!result.success || result.meta.changes === 0) {
      throw new ConcurrencyConflictError('talk', id, expectedVersion);
    }

    const updated = await this.getById(id);
    if (!updated) throw new Error(`Failed to retrieve updated talk ${id}`);
    return updated;
  }

  async delete(id: string, expectedVersion: number): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM talks WHERE id = ? AND version = ?')
      .bind(id, expectedVersion)
      .run();

    if (!result.success || result.meta.changes === 0) {
      throw new ConcurrencyConflictError('talk', id, expectedVersion);
    }
    return true;
  }
}
