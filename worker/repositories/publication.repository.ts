// ================================================================
// PUBLICATION REPOSITORY
// Research publications data access with atomic D1 batch mutation & revision auditing
// ================================================================

import { PublicationRecord } from '../types';
import { ConcurrencyConflictError } from '../errors';
import { RevisionRepository } from './revision.repository';

export class PublicationRepository {
  constructor(private db: D1Database) {}

  async getAllPublic(): Promise<PublicationRecord[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM publications WHERE published = 1 ORDER BY display_order ASC, year DESC')
      .all<PublicationRecord>();
    return results || [];
  }

  async getById(id: string): Promise<PublicationRecord | null> {
    return await this.db
      .prepare('SELECT * FROM publications WHERE id = ?')
      .bind(id)
      .first<PublicationRecord>();
  }

  prepareInsertStatement(
    data: Omit<PublicationRecord, 'version' | 'created_at' | 'updated_at'>,
    now: string
  ): D1PreparedStatement {
    return this.db
      .prepare(`
        INSERT INTO publications (
          id, code_number, title, authors, venue, publication_type, year,
          doi, external_url, pdf_asset_id, featured, published, display_order,
          version, created_at, updated_at, metadata
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?
        )
      `)
      .bind(
        data.id,
        data.code_number || null,
        data.title,
        data.authors,
        data.venue,
        data.publication_type,
        data.year,
        data.doi || null,
        data.external_url || null,
        data.pdf_asset_id || null,
        data.featured ? 1 : 0,
        data.published ? 1 : 0,
        data.display_order,
        now,
        now,
        data.metadata || null
      );
  }

  prepareUpdateStatement(
    id: string,
    data: Omit<PublicationRecord, 'id' | 'version' | 'created_at' | 'updated_at'>,
    expectedVersion: number,
    now: string
  ): D1PreparedStatement {
    return this.db
      .prepare(`
        UPDATE publications SET
          code_number = ?,
          title = ?,
          authors = ?,
          venue = ?,
          publication_type = ?,
          year = ?,
          doi = ?,
          external_url = ?,
          pdf_asset_id = ?,
          featured = ?,
          published = ?,
          display_order = ?,
          version = version + 1,
          updated_at = ?,
          metadata = ?
        WHERE id = ? AND version = ?
      `)
      .bind(
        data.code_number || null,
        data.title,
        data.authors,
        data.venue,
        data.publication_type,
        data.year,
        data.doi || null,
        data.external_url || null,
        data.pdf_asset_id || null,
        data.featured ? 1 : 0,
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
      .prepare('DELETE FROM publications WHERE id = ? AND version = ?')
      .bind(id, expectedVersion);
  }

  async createWithRevision(
    data: Omit<PublicationRecord, 'version' | 'created_at' | 'updated_at'>,
    author: string
  ): Promise<PublicationRecord> {
    const now = new Date().toISOString();
    const insertStmt = this.prepareInsertStatement(data, now);

    const revRepo = new RevisionRepository(this.db);
    const revStmt = revRepo.createRevisionStatement({
      id: `rev-publication-${data.id}-1-${Date.now()}`,
      entity_type: 'publication',
      entity_id: data.id,
      version: 1,
      action: 'create',
      payload_json: JSON.stringify({ ...data, version: 1 }),
      author,
      created_at: now
    });

    await this.db.batch([insertStmt, revStmt]);
    const created = await this.getById(data.id);
    if (!created) throw new Error(`Failed to create publication ${data.id}`);
    return created;
  }

  async updateWithRevision(
    id: string,
    data: Omit<PublicationRecord, 'id' | 'version' | 'created_at' | 'updated_at'>,
    expectedVersion: number,
    author: string
  ): Promise<PublicationRecord> {
    const now = new Date().toISOString();
    const nextVersion = expectedVersion + 1;
    const updateStmt = this.prepareUpdateStatement(id, data, expectedVersion, now);

    const revRepo = new RevisionRepository(this.db);
    const revStmt = revRepo.createConditionalRevisionStatement({
      id: `rev-publication-${id}-${nextVersion}-${Date.now()}`,
      entity_type: 'publication',
      entity_id: id,
      version: nextVersion,
      action: 'update',
      payload_json: JSON.stringify({ id, ...data, version: nextVersion }),
      author,
      created_at: now
    });

    const [updateRes] = await this.db.batch([updateStmt, revStmt]);

    if (!updateRes.success || updateRes.meta.changes === 0) {
      throw new ConcurrencyConflictError('publication', id, expectedVersion);
    }

    const updated = await this.getById(id);
    if (!updated) throw new Error(`Failed to retrieve updated publication ${id}`);
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
      id: `rev-publication-${id}-${nextVersion}-${Date.now()}`,
      entity_type: 'publication',
      entity_id: id,
      version: nextVersion,
      action: 'delete',
      payload_json: JSON.stringify({ id, version: nextVersion }),
      author,
      created_at: now
    });

    const [deleteRes] = await this.db.batch([deleteStmt, revStmt]);

    if (!deleteRes.success || deleteRes.meta.changes === 0) {
      throw new ConcurrencyConflictError('publication', id, expectedVersion);
    }

    return true;
  }

  async create(data: Omit<PublicationRecord, 'version' | 'created_at' | 'updated_at'>): Promise<PublicationRecord> {
    return await this.createWithRevision(data, 'system');
  }

  async update(
    id: string,
    data: Omit<PublicationRecord, 'id' | 'version' | 'created_at' | 'updated_at'>,
    expectedVersion: number
  ): Promise<PublicationRecord> {
    return await this.updateWithRevision(id, data, expectedVersion, 'system');
  }

  async delete(id: string, expectedVersion: number): Promise<boolean> {
    return await this.deleteWithRevision(id, expectedVersion, 'system');
  }
}
