// ================================================================
// SOCIAL LINK REPOSITORY
// External academic profiles data access with atomic D1 batch mutation & revision auditing
// ================================================================

import { SocialLinkRecord } from '../types';
import { ConcurrencyConflictError } from '../errors';
import { RevisionRepository } from './revision.repository';

export class SocialLinkRepository {
  constructor(private db: D1Database) {}

  async getAllPublic(): Promise<SocialLinkRecord[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM social_links WHERE published = 1 AND visible = 1 ORDER BY display_order ASC')
      .all<SocialLinkRecord>();
    return results || [];
  }

  async getById(id: string): Promise<SocialLinkRecord | null> {
    return await this.db
      .prepare('SELECT * FROM social_links WHERE id = ?')
      .bind(id)
      .first<SocialLinkRecord>();
  }

  prepareInsertStatement(
    data: Omit<SocialLinkRecord, 'version' | 'created_at' | 'updated_at'>,
    now: string
  ): D1PreparedStatement {
    return this.db
      .prepare(`
        INSERT INTO social_links (
          id, platform, url, icon, display_order, visible,
          published, version, created_at, updated_at, metadata
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?
        )
      `)
      .bind(
        data.id,
        data.platform,
        data.url,
        data.icon,
        data.display_order,
        data.visible ? 1 : 0,
        data.published ? 1 : 0,
        now,
        now,
        data.metadata || null
      );
  }

  prepareUpdateStatement(
    id: string,
    data: Omit<SocialLinkRecord, 'id' | 'version' | 'created_at' | 'updated_at'>,
    expectedVersion: number,
    now: string
  ): D1PreparedStatement {
    return this.db
      .prepare(`
        UPDATE social_links SET
          platform = ?,
          url = ?,
          icon = ?,
          display_order = ?,
          visible = ?,
          published = ?,
          version = version + 1,
          updated_at = ?,
          metadata = ?
        WHERE id = ? AND version = ?
      `)
      .bind(
        data.platform,
        data.url,
        data.icon,
        data.display_order,
        data.visible ? 1 : 0,
        data.published ? 1 : 0,
        now,
        data.metadata || null,
        id,
        expectedVersion
      );
  }

  prepareDeleteStatement(id: string, expectedVersion: number): D1PreparedStatement {
    return this.db
      .prepare('DELETE FROM social_links WHERE id = ? AND version = ?')
      .bind(id, expectedVersion);
  }

  async createWithRevision(
    data: Omit<SocialLinkRecord, 'version' | 'created_at' | 'updated_at'>,
    author: string
  ): Promise<SocialLinkRecord> {
    const now = new Date().toISOString();
    const insertStmt = this.prepareInsertStatement(data, now);

    const revRepo = new RevisionRepository(this.db);
    const revStmt = revRepo.createRevisionStatement({
      id: `rev-social-${data.id}-1-${Date.now()}`,
      entity_type: 'social_link',
      entity_id: data.id,
      version: 1,
      action: 'create',
      payload_json: JSON.stringify({ ...data, version: 1 }),
      author,
      created_at: now
    });

    await this.db.batch([insertStmt, revStmt]);
    const created = await this.getById(data.id);
    if (!created) throw new Error(`Failed to create social link ${data.id}`);
    return created;
  }

  async updateWithRevision(
    id: string,
    data: Omit<SocialLinkRecord, 'id' | 'version' | 'created_at' | 'updated_at'>,
    expectedVersion: number,
    author: string
  ): Promise<SocialLinkRecord> {
    const now = new Date().toISOString();
    const nextVersion = expectedVersion + 1;
    const updateStmt = this.prepareUpdateStatement(id, data, expectedVersion, now);

    const revRepo = new RevisionRepository(this.db);
    const revStmt = revRepo.createConditionalRevisionStatement({
      id: `rev-social-${id}-${nextVersion}-${Date.now()}`,
      entity_type: 'social_link',
      entity_id: id,
      version: nextVersion,
      action: 'update',
      payload_json: JSON.stringify({ id, ...data, version: nextVersion }),
      author,
      created_at: now
    });

    const [updateRes] = await this.db.batch([updateStmt, revStmt]);

    if (!updateRes.success || updateRes.meta.changes === 0) {
      throw new ConcurrencyConflictError('social_link', id, expectedVersion);
    }

    const updated = await this.getById(id);
    if (!updated) throw new Error(`Failed to retrieve updated social link ${id}`);
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
      id: `rev-social-${id}-${nextVersion}-${Date.now()}`,
      entity_type: 'social_link',
      entity_id: id,
      version: nextVersion,
      action: 'delete',
      payload_json: JSON.stringify({ id, version: nextVersion }),
      author,
      created_at: now
    });

    const [deleteRes] = await this.db.batch([deleteStmt, revStmt]);

    if (!deleteRes.success || deleteRes.meta.changes === 0) {
      throw new ConcurrencyConflictError('social_link', id, expectedVersion);
    }

    return true;
  }

  async create(data: Omit<SocialLinkRecord, 'version' | 'created_at' | 'updated_at'>): Promise<SocialLinkRecord> {
    return await this.createWithRevision(data, 'system');
  }

  async update(
    id: string,
    data: Omit<SocialLinkRecord, 'id' | 'version' | 'created_at' | 'updated_at'>,
    expectedVersion: number
  ): Promise<SocialLinkRecord> {
    return await this.updateWithRevision(id, data, expectedVersion, 'system');
  }

  async delete(id: string, expectedVersion: number): Promise<boolean> {
    return await this.deleteWithRevision(id, expectedVersion, 'system');
  }
}
