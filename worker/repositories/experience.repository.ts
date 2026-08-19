import { ExperienceRecord } from '../types';
import { ConcurrencyConflictError } from '../errors';

export class ExperienceRepository {
  constructor(private db: D1Database) {}

  async getAllPublic(): Promise<ExperienceRecord[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM experience WHERE published = 1 ORDER BY display_order ASC')
      .all<ExperienceRecord>();
    return results || [];
  }

  async getById(id: string): Promise<ExperienceRecord | null> {
    return await this.db
      .prepare('SELECT * FROM experience WHERE id = ?')
      .bind(id)
      .first<ExperienceRecord>();
  }

  async create(data: Omit<ExperienceRecord, 'version' | 'created_at' | 'updated_at'>): Promise<ExperienceRecord> {
    const now = new Date().toISOString();
    await this.db
      .prepare(`
        INSERT INTO experience (
          id, role, organization, start_year, end_year, is_current,
          published, display_order, version, created_at, updated_at, metadata
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?
        )
      `)
      .bind(
        data.id,
        data.role,
        data.organization,
        data.start_year,
        data.end_year,
        data.is_current ? 1 : 0,
        data.published ? 1 : 0,
        data.display_order,
        now,
        now,
        data.metadata || null
      )
      .run();

    const created = await this.getById(data.id);
    if (!created) throw new Error(`Failed to create experience ${data.id}`);
    return created;
  }

  async update(
    id: string,
    data: Omit<ExperienceRecord, 'id' | 'version' | 'created_at' | 'updated_at'>,
    expectedVersion: number
  ): Promise<ExperienceRecord> {
    const now = new Date().toISOString();
    const result = await this.db
      .prepare(`
        UPDATE experience SET
          role = ?,
          organization = ?,
          start_year = ?,
          end_year = ?,
          is_current = ?,
          published = ?,
          display_order = ?,
          version = version + 1,
          updated_at = ?,
          metadata = ?
        WHERE id = ? AND version = ?
      `)
      .bind(
        data.role,
        data.organization,
        data.start_year,
        data.end_year,
        data.is_current ? 1 : 0,
        data.published ? 1 : 0,
        data.display_order,
        now,
        data.metadata || null,
        id,
        expectedVersion
      )
      .run();

    if (!result.success || result.meta.changes === 0) {
      throw new ConcurrencyConflictError('experience', id, expectedVersion);
    }

    const updated = await this.getById(id);
    if (!updated) throw new Error(`Failed to retrieve updated experience ${id}`);
    return updated;
  }

  async delete(id: string, expectedVersion: number): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM experience WHERE id = ? AND version = ?')
      .bind(id, expectedVersion)
      .run();

    if (!result.success || result.meta.changes === 0) {
      throw new ConcurrencyConflictError('experience', id, expectedVersion);
    }
    return true;
  }
}
