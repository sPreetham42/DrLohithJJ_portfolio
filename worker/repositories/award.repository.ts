import { AwardRecord } from '../types';
import { ConcurrencyConflictError } from '../errors';

export class AwardRepository {
  constructor(private db: D1Database) {}

  async getAllPublic(): Promise<AwardRecord[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM awards WHERE published = 1 ORDER BY display_order ASC')
      .all<AwardRecord>();
    return results || [];
  }

  async getById(id: string): Promise<AwardRecord | null> {
    return await this.db
      .prepare('SELECT * FROM awards WHERE id = ?')
      .bind(id)
      .first<AwardRecord>();
  }

  async create(data: Omit<AwardRecord, 'version' | 'created_at' | 'updated_at'>): Promise<AwardRecord> {
    const now = new Date().toISOString();
    await this.db
      .prepare(`
        INSERT INTO awards (
          id, title, organization, year, description, certificate_asset_id,
          published, display_order, version, created_at, updated_at, metadata
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?
        )
      `)
      .bind(
        data.id,
        data.title,
        data.organization,
        data.year,
        data.description || null,
        data.certificate_asset_id || null,
        data.published ? 1 : 0,
        data.display_order,
        now,
        now,
        data.metadata || null
      )
      .run();

    const created = await this.getById(data.id);
    if (!created) throw new Error(`Failed to create award ${data.id}`);
    return created;
  }

  async update(
    id: string,
    data: Omit<AwardRecord, 'id' | 'version' | 'created_at' | 'updated_at'>,
    expectedVersion: number
  ): Promise<AwardRecord> {
    const now = new Date().toISOString();
    const result = await this.db
      .prepare(`
        UPDATE awards SET
          title = ?,
          organization = ?,
          year = ?,
          description = ?,
          certificate_asset_id = ?,
          published = ?,
          display_order = ?,
          version = version + 1,
          updated_at = ?,
          metadata = ?
        WHERE id = ? AND version = ?
      `)
      .bind(
        data.title,
        data.organization,
        data.year,
        data.description || null,
        data.certificate_asset_id || null,
        data.published ? 1 : 0,
        data.display_order,
        now,
        data.metadata || null,
        id,
        expectedVersion
      )
      .run();

    if (!result.success || result.meta.changes === 0) {
      throw new ConcurrencyConflictError('award', id, expectedVersion);
    }

    const updated = await this.getById(id);
    if (!updated) throw new Error(`Failed to retrieve updated award ${id}`);
    return updated;
  }

  async delete(id: string, expectedVersion: number): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM awards WHERE id = ? AND version = ?')
      .bind(id, expectedVersion)
      .run();

    if (!result.success || result.meta.changes === 0) {
      throw new ConcurrencyConflictError('award', id, expectedVersion);
    }
    return true;
  }
}
