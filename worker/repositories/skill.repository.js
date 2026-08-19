import { ConcurrencyConflictError } from '../errors.js';

export class SkillCategoryRepository {
  constructor(db) {
    this.db = db;
  }

  async getAllPublic() {
    const { results } = await this.db
      .prepare('SELECT * FROM skill_categories WHERE published = 1 ORDER BY display_order ASC')
      .all();
    return results || [];
  }

  async getById(id) {
    return await this.db
      .prepare('SELECT * FROM skill_categories WHERE id = ?')
      .bind(id)
      .first();
  }

  async create(data) {
    const now = new Date().toISOString();
    await this.db
      .prepare(`
        INSERT INTO skill_categories (
          id, category, skills_json, published, display_order,
          version, created_at, updated_at, metadata
        ) VALUES (
          ?, ?, ?, ?, ?, 1, ?, ?, ?
        )
      `)
      .bind(
        data.id,
        data.category,
        data.skills_json,
        data.published ? 1 : 0,
        data.display_order,
        now,
        now,
        data.metadata || null
      )
      .run();

    const created = await this.getById(data.id);
    if (!created) throw new Error(`Failed to create skill category ${data.id}`);
    return created;
  }

  async update(id, data, expectedVersion) {
    const now = new Date().toISOString();
    const result = await this.db
      .prepare(`
        UPDATE skill_categories SET
          category = ?,
          skills_json = ?,
          published = ?,
          display_order = ?,
          version = version + 1,
          updated_at = ?,
          metadata = ?
        WHERE id = ? AND version = ?
      `)
      .bind(
        data.category,
        data.skills_json,
        data.published ? 1 : 0,
        data.display_order,
        now,
        data.metadata || null,
        id,
        expectedVersion
      )
      .run();

    if (!result.success || result.meta.changes === 0) {
      throw new ConcurrencyConflictError('skillCategory', id, expectedVersion);
    }

    const updated = await this.getById(id);
    if (!updated) throw new Error(`Failed to retrieve updated skill category ${id}`);
    return updated;
  }

  async delete(id, expectedVersion) {
    const result = await this.db
      .prepare('DELETE FROM skill_categories WHERE id = ? AND version = ?')
      .bind(id, expectedVersion)
      .run();

    if (!result.success || result.meta.changes === 0) {
      throw new ConcurrencyConflictError('skillCategory', id, expectedVersion);
    }
    return true;
  }
}
