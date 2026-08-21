// ================================================================
// REVISION REPOSITORY
// Audit log and optimistic concurrency revision tracking
// ================================================================

import { RevisionRecord } from '../types';

export class RevisionRepository {
  constructor(private db: D1Database) {}

  createRevisionStatement(record: RevisionRecord): D1PreparedStatement {
    return this.db
      .prepare(`
        INSERT INTO revisions (
          id, entity_type, entity_id, version, action,
          payload_json, author, created_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?
        )
      `)
      .bind(
        record.id,
        record.entity_type,
        record.entity_id,
        record.version,
        record.action,
        record.payload_json,
        record.author || 'system',
        record.created_at || new Date().toISOString()
      );
  }

  /**
   * Prepares a conditional revision insertion for batch operations that strictly
   * verifies the preceding UPDATE/DELETE statement modified at least 1 row (changes() > 0),
   * preventing phantom/orphaned revisions on optimistic concurrency conflicts.
   */
  createConditionalRevisionStatement(record: RevisionRecord): D1PreparedStatement {
    return this.db
      .prepare(`
        INSERT INTO revisions (
          id, entity_type, entity_id, version, action,
          payload_json, author, created_at
        )
        SELECT ?, ?, ?, ?, ?, ?, ?, ?
        WHERE changes() > 0
      `)
      .bind(
        record.id,
        record.entity_type,
        record.entity_id,
        record.version,
        record.action,
        record.payload_json,
        record.author || 'system',
        record.created_at || new Date().toISOString()
      );
  }

  async create(record: RevisionRecord): Promise<void> {
    await this.createRevisionStatement(record).run();
  }

  async getHistoryForEntity(entityType: string, entityId: string): Promise<RevisionRecord[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM revisions WHERE entity_type = ? AND entity_id = ? ORDER BY version DESC')
      .bind(entityType, entityId)
      .all<RevisionRecord>();
    return results || [];
  }
}
