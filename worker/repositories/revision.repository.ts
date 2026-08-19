import { RevisionRecord } from '../types';

export class RevisionRepository {
  constructor(private db: D1Database) {}

  async create(record: RevisionRecord): Promise<void> {
    await this.db
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
      )
      .run();
  }

  async getHistoryForEntity(entityType: string, entityId: string): Promise<RevisionRecord[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM revisions WHERE entity_type = ? AND entity_id = ? ORDER BY version DESC')
      .bind(entityType, entityId)
      .all<RevisionRecord>();
    return results || [];
  }
}
