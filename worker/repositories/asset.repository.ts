import { AssetRecord } from '../types';

export class AssetRepository {
  constructor(private db: D1Database) {}

  async getById(id: string): Promise<AssetRecord | null> {
    return await this.db
      .prepare('SELECT * FROM assets WHERE id = ?')
      .bind(id)
      .first<AssetRecord>();
  }

  async getAll(): Promise<AssetRecord[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM assets ORDER BY created_at ASC')
      .all<AssetRecord>();
    return results || [];
  }

  async upsert(data: AssetRecord): Promise<void> {
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
