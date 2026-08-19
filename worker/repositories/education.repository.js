import { ConcurrencyConflictError } from '../errors.js';

export class EducationRepository {
  constructor(db) {
    this.db = db;
  }

  async getAllPublic() {
    const { results } = await this.db
      .prepare('SELECT * FROM education WHERE published = 1 ORDER BY display_order ASC')
      .all();
    return results || [];
  }

  async getById(id) {
    return await this.db
      .prepare('SELECT * FROM education WHERE id = ?')
      .bind(id)
      .first();
  }

  async create(data) {
    const now = new Date().toISOString();
    await this.db
      .prepare(`
        INSERT INTO education (
          id, degree, institution, year, thesis, published,
          display_order, version, created_at, updated_at, metadata
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?
        )
      `)
      .bind(
        data.id,
        data.degree,
        data.institution,
        data.year,
        data.thesis || null,
        data.published ? 1 : 0,
        data.display_order,
        now,
        now,
        data.metadata || null
      )
      .run();

    const created = await this.getById(data.id);
    if (!created) throw new Error(`Failed to create education ${data.id}`);
    return created;
  }

  async update(id, data, expectedVersion) {
    const now = new Date().toISOString();
    const result = await this.db
      .prepare(`
        UPDATE education SET
          degree = ?,
          institution = ?,
          year = ?,
          thesis = ?,
          published = ?,
          display_order = ?,
          version = version + 1,
          updated_at = ?,
          metadata = ?
        WHERE id = ? AND version = ?
      `)
      .bind(
        data.degree,
        data.institution,
        data.year,
        data.thesis || null,
        data.published ? 1 : 0,
        data.display_order,
        now,
        data.metadata || null,
        id,
        expectedVersion
      )
      .run();

    if (!result.success || result.meta.changes === 0) {
      throw new ConcurrencyConflictError('education', id, expectedVersion);
    }

    const updated = await this.getById(id);
    if (!updated) throw new Error(`Failed to retrieve updated education ${id}`);
    return updated;
  }

  async delete(id, expectedVersion) {
    const result = await this.db
      .prepare('DELETE FROM education WHERE id = ? AND version = ?')
      .bind(id, expectedVersion)
      .run();

    if (!result.success || result.meta.changes === 0) {
      throw new ConcurrencyConflictError('education', id, expectedVersion);
    }
    return true;
  }
}
