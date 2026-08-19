import { ConcurrencyConflictError } from '../errors.js';

export class PublicationRepository {
  constructor(db) {
    this.db = db;
  }

  async getAllPublic() {
    const { results } = await this.db
      .prepare('SELECT * FROM publications WHERE published = 1 ORDER BY display_order ASC, year DESC')
      .all();
    return results || [];
  }

  async getById(id) {
    return await this.db
      .prepare('SELECT * FROM publications WHERE id = ?')
      .bind(id)
      .first();
  }

  async create(data) {
    const now = new Date().toISOString();
    await this.db
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
      )
      .run();

    const created = await this.getById(data.id);
    if (!created) throw new Error(`Failed to create publication ${data.id}`);
    return created;
  }

  async update(id, data, expectedVersion) {
    const now = new Date().toISOString();
    const result = await this.db
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
      )
      .run();

    if (!result.success || result.meta.changes === 0) {
      throw new ConcurrencyConflictError('publication', id, expectedVersion);
    }

    const updated = await this.getById(id);
    if (!updated) throw new Error(`Failed to retrieve updated publication ${id}`);
    return updated;
  }

  async delete(id, expectedVersion) {
    const result = await this.db
      .prepare('DELETE FROM publications WHERE id = ? AND version = ?')
      .bind(id, expectedVersion)
      .run();

    if (!result.success || result.meta.changes === 0) {
      throw new ConcurrencyConflictError('publication', id, expectedVersion);
    }
    return true;
  }
}
