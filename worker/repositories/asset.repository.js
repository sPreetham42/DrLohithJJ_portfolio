export class AssetRepository {
  constructor(db) {
    this.db = db;
  }

  async getById(id) {
    return await this.db
      .prepare('SELECT * FROM assets WHERE id = ?')
      .bind(id)
      .first();
  }

  async getAll() {
    const { results } = await this.db
      .prepare('SELECT * FROM assets ORDER BY created_at ASC')
      .all();
    return results || [];
  }

  async upsert(data) {
    await this.db
      .prepare(`
        INSERT INTO assets (
          id, storage_key, filename, mime_type, byte_size,
          is_primary_photo, created_at, metadata
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?
        )
        ON CONFLICT(id) DO UPDATE SET
          storage_key = excluded.storage_key,
          filename = excluded.filename,
          mime_type = excluded.mime_type,
          byte_size = excluded.byte_size,
          is_primary_photo = excluded.is_primary_photo,
          metadata = excluded.metadata
      `)
      .bind(
        data.id,
        data.storage_key,
        data.filename,
        data.mime_type,
        data.byte_size,
        data.is_primary_photo ? 1 : 0,
        data.created_at || new Date().toISOString(),
        data.metadata || null
      )
      .run();
  }
}
