import { ConcurrencyConflictError } from '../errors.js';

export class SocialLinkRepository {
  constructor(db) {
    this.db = db;
  }

  async getAllPublic() {
    const { results } = await this.db
      .prepare('SELECT * FROM social_links WHERE published = 1 AND visible = 1 ORDER BY display_order ASC')
      .all();
    return results || [];
  }

  async getById(id) {
    return await this.db
      .prepare('SELECT * FROM social_links WHERE id = ?')
      .bind(id)
      .first();
  }

  async create(data) {
    const now = new Date().toISOString();
    await this.db
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
      )
      .run();

    const created = await this.getById(data.id);
    if (!created) throw new Error(`Failed to create social link ${data.id}`);
    return created;
  }

  async update(id, data, expectedVersion) {
    const now = new Date().toISOString();
    const result = await this.db
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
      )
      .run();

    if (!result.success || result.meta.changes === 0) {
      throw new ConcurrencyConflictError('socialLink', id, expectedVersion);
    }

    const updated = await this.getById(id);
    if (!updated) throw new Error(`Failed to retrieve updated social link ${id}`);
    return updated;
  }

  async delete(id, expectedVersion) {
    const result = await this.db
      .prepare('DELETE FROM social_links WHERE id = ? AND version = ?')
      .bind(id, expectedVersion)
      .run();

    if (!result.success || result.meta.changes === 0) {
      throw new ConcurrencyConflictError('socialLink', id, expectedVersion);
    }
    return true;
  }
}
