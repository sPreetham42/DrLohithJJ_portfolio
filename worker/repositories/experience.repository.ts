// ================================================================
// EXPERIENCE REPOSITORY
// Academic & professional journey data access with atomic D1 batch mutation & revision auditing
// ================================================================

import { ExperienceRecord } from '../types';
import { ConcurrencyConflictError } from '../errors';
import { RevisionRepository } from './revision.repository';

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

  prepareInsertStatement(
    data: Omit<ExperienceRecord, 'version' | 'created_at' | 'updated_at'>,
    now: string
  ): D1PreparedStatement {
    return this.db
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
      );
  }

  prepareUpdateStatement(
    id: string,
    data: Omit<ExperienceRecord, 'id' | 'version' | 'created_at' | 'updated_at'>,
    expectedVersion: number,
    now: string
  ): D1PreparedStatement {
    return this.db
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
      );
  }

  prepareDeleteStatement(id: string, expectedVersion: number): D1PreparedStatement {
    return this.db
      .prepare('DELETE FROM experience WHERE id = ? AND version = ?')
      .bind(id, expectedVersion);
  }

  async createWithRevision(
    data: Omit<ExperienceRecord, 'version' | 'created_at' | 'updated_at'>,
    author: string
  ): Promise<ExperienceRecord> {
    const now = new Date().toISOString();
    const insertStmt = this.prepareInsertStatement(data, now);

    const revRepo = new RevisionRepository(this.db);
    const revStmt = revRepo.createRevisionStatement({
      id: `rev-experience-${data.id}-1-${Date.now()}`,
      entity_type: 'experience',
      entity_id: data.id,
      version: 1,
      action: 'create',
      payload_json: JSON.stringify({ ...data, version: 1 }),
      author,
      created_at: now
    });

    await this.db.batch([insertStmt, revStmt]);
    const created = await this.getById(data.id);
    if (!created) throw new Error(`Failed to create experience ${data.id}`);
    return created;
  }

  async updateWithRevision(
    id: string,
    data: Omit<ExperienceRecord, 'id' | 'version' | 'created_at' | 'updated_at'>,
    expectedVersion: number,
    author: string
  ): Promise<ExperienceRecord> {
    const now = new Date().toISOString();
    const nextVersion = expectedVersion + 1;
    const updateStmt = this.prepareUpdateStatement(id, data, expectedVersion, now);

    const revRepo = new RevisionRepository(this.db);
    const revStmt = revRepo.createConditionalRevisionStatement({
      id: `rev-experience-${id}-${nextVersion}-${Date.now()}`,
      entity_type: 'experience',
      entity_id: id,
      version: nextVersion,
      action: 'update',
      payload_json: JSON.stringify({ id, ...data, version: nextVersion }),
      author,
      created_at: now
    });

    const [updateRes] = await this.db.batch([updateStmt, revStmt]);

    if (!updateRes.success || updateRes.meta.changes === 0) {
      throw new ConcurrencyConflictError('experience', id, expectedVersion);
    }

    const updated = await this.getById(id);
    if (!updated) throw new Error(`Failed to retrieve updated experience ${id}`);
    return updated;
  }

  async deleteWithRevision(
    id: string,
    expectedVersion: number,
    author: string
  ): Promise<boolean> {
    const now = new Date().toISOString();
    const nextVersion = expectedVersion + 1;
    const deleteStmt = this.prepareDeleteStatement(id, expectedVersion);

    const revRepo = new RevisionRepository(this.db);
    const revStmt = revRepo.createConditionalRevisionStatement({
      id: `rev-experience-${id}-${nextVersion}-${Date.now()}`,
      entity_type: 'experience',
      entity_id: id,
      version: nextVersion,
      action: 'delete',
      payload_json: JSON.stringify({ id, version: nextVersion }),
      author,
      created_at: now
    });

    const [deleteRes] = await this.db.batch([deleteStmt, revStmt]);

    if (!deleteRes.success || deleteRes.meta.changes === 0) {
      throw new ConcurrencyConflictError('experience', id, expectedVersion);
    }

    return true;
  }

  async create(data: Omit<ExperienceRecord, 'version' | 'created_at' | 'updated_at'>): Promise<ExperienceRecord> {
    return await this.createWithRevision(data, 'system');
  }

  async update(
    id: string,
    data: Omit<ExperienceRecord, 'id' | 'version' | 'created_at' | 'updated_at'>,
    expectedVersion: number
  ): Promise<ExperienceRecord> {
    return await this.updateWithRevision(id, data, expectedVersion, 'system');
  }

  async delete(id: string, expectedVersion: number): Promise<boolean> {
    return await this.deleteWithRevision(id, expectedVersion, 'system');
  }
}
