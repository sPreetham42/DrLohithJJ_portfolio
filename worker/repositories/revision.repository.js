export class RevisionRepository {
  constructor(db) {
    this.db = db;
  }

  async create(record) {
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

  async getHistoryForEntity(entityType, entityId) {
    const { results } = await this.db
      .prepare('SELECT * FROM revisions WHERE entity_type = ? AND entity_id = ? ORDER BY version DESC')
      .bind(entityType, entityId)
      .all();
    return results || [];
  }
}
