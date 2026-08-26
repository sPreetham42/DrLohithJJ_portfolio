// ================================================================
// REAL LOCAL D1 SQLITE TEST ADAPTER
// Executes actual SQL migrations (0001-0005) and real SQLite transactions
// to faithfully replicate Cloudflare D1 environment in Vitest.
// ================================================================

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export class LocalD1PreparedStatement implements D1PreparedStatement {
  constructor(
    private db: Database.Database,
    private query: string,
    private params: any[] = []
  ) {}

  bind(...args: any[]): D1PreparedStatement {
    return new LocalD1PreparedStatement(this.db, this.query, args);
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    const stmt = this.db.prepare(this.query);
    const row = stmt.get(...this.params) as Record<string, any> | undefined;
    if (!row) return null;
    if (colName) return (row[colName] as T) ?? null;
    return row as T;
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    const stmt = this.db.prepare(this.query);
    const rows = stmt.all(...this.params) as T[];
    return {
      results: rows,
      success: true,
      meta: {
        changes: 0,
        last_row_id: 0,
        duration: 1,
        rows_read: rows.length,
        rows_written: 0,
        served_by: 'local-sqlite'
      }
    };
  }

  async run<T = unknown>(): Promise<D1Response> {
    const stmt = this.db.prepare(this.query);
    const info = stmt.run(...this.params);
    return {
      success: true,
      meta: {
        changes: info.changes,
        last_row_id: Number(info.lastInsertRowid),
        duration: 1,
        rows_read: 0,
        rows_written: info.changes,
        served_by: 'local-sqlite'
      }
    };
  }

  async raw<T = unknown>(): Promise<T[]> {
    const stmt = this.db.prepare(this.query);
    const rows = stmt.raw().all(...this.params);
    return rows as T[];
  }

  // Internal accessors for transaction batching
  getSql(): string {
    return this.query;
  }

  getParams(): any[] {
    return this.params;
  }

  executeSync(): { changes: number; lastInsertRowid: number | bigint } {
    const stmt = this.db.prepare(this.query);
    return stmt.run(...this.params);
  }
}

export class LocalD1Database implements D1Database {
  public rawDb: Database.Database;

  constructor(memory = true) {
    this.rawDb = new Database(memory ? ':memory:' : undefined);
    this.rawDb.pragma('foreign_keys = ON');
  }

  prepare(query: string): D1PreparedStatement {
    return new LocalD1PreparedStatement(this.rawDb, query);
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    const results: D1Result<T>[] = [];
    const runBatch = this.rawDb.transaction((stmts: LocalD1PreparedStatement[]) => {
      for (const stmt of stmts) {
        const sql = stmt.getSql();
        const params = stmt.getParams();
        const prepared = this.rawDb.prepare(sql);
        const isSelect = /^\s*(SELECT|PRAGMA)/i.test(sql);

        if (isSelect) {
          const rows = prepared.all(...params) as T[];
          results.push({
            results: rows,
            success: true,
            meta: {
              changes: 0,
              last_row_id: 0,
              duration: 1,
              rows_read: rows.length,
              rows_written: 0,
              served_by: 'local-sqlite'
            }
          });
        } else {
          const info = prepared.run(...params);
          results.push({
            results: [] as T[],
            success: true,
            meta: {
              changes: info.changes,
              last_row_id: Number(info.lastInsertRowid),
              duration: 1,
              rows_read: 0,
              rows_written: info.changes,
              served_by: 'local-sqlite'
            }
          });
        }
      }
    });

    runBatch(statements as LocalD1PreparedStatement[]);
    return results;
  }

  async exec(query: string): Promise<D1ExecResult> {
    this.rawDb.exec(query);
    return {
      count: 1,
      duration: 1
    };
  }

  async dump(): Promise<ArrayBuffer> {
    throw new Error('dump not implemented in local test mock');
  }
}

/**
 * Creates a fresh local SQLite D1 database and applies all migrations in db/migrations/*.sql.
 */
export async function createLocalTestD1(): Promise<LocalD1Database> {
  const d1 = new LocalD1Database(true);
  const migrationsDir = path.resolve(process.cwd(), 'db/migrations');
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, 'utf-8');
    d1.rawDb.exec(sql);
  }

  return d1;
}

/**
 * Seeds canonical data snapshot into the local D1 instance.
 */
export async function seedLocalTestD1(d1: LocalD1Database): Promise<void> {
  const snapshotPath = path.resolve(process.cwd(), 'current-portfolio-snapshot.json');
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
  const now = new Date().toISOString();

  // 1. Assets
  const insertAsset = d1.rawDb.prepare(`
    INSERT INTO assets (id, storage_key, filename, mime_type, byte_size, is_primary_photo, created_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const a of snapshot.assets || []) {
    insertAsset.run(
      a.id,
      a.storageKey || a.storage_key || a.localPath || a.filename,
      a.filename,
      a.mimeType || a.mime_type,
      a.byteSize || a.byte_size || 0,
      a.isPrimaryPhoto ? 1 : 0,
      a.createdAt || a.created_at || now,
      a.metadata ? JSON.stringify(a.metadata) : null
    );
  }

  // 2. Profile
  const p = snapshot.profile;
  if (p) {
    d1.rawDb.prepare(`
      INSERT INTO profile (
        id, name, credential, designation, years_experience, current_institution,
        hero_description_line1, hero_description_line2, email_primary, email_secondary,
        phone, address, photo_asset_id, additional_roles_json, professional_memberships_json,
        version, updated_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'profile',
      p.name,
      p.credential || null,
      p.designation,
      p.yearsExperience || p.years_experience || 20,
      p.currentInstitution || p.current_institution,
      p.heroDescriptionLine1 || p.hero_description_line1 || '',
      p.heroDescriptionLine2 || p.hero_description_line2 || '',
      p.emailPrimary || p.email_primary,
      p.emailSecondary || p.email_secondary || null,
      p.phone,
      p.address,
      p.photoAssetId || p.photo_asset_id || null,
      JSON.stringify(p.additionalRoles || p.additional_roles || []),
      JSON.stringify(p.professionalMemberships || p.professional_memberships || []),
      p.version || 1,
      p.updatedAt || p.updated_at || now,
      p.metadata ? JSON.stringify(p.metadata) : null
    );
  }

  // 3. Scholar Stats
  let s = snapshot.scholarStats || snapshot.scholar_stats;
  if (!s) {
    const scholarJsonPath = path.resolve(process.cwd(), 'data/scholar.json');
    if (fs.existsSync(scholarJsonPath)) {
      const scholarJson = JSON.parse(fs.readFileSync(scholarJsonPath, 'utf-8'));
      s = {
        citations: scholarJson.citations || 172,
        hIndex: scholarJson.h_index || 8,
        i10Index: scholarJson.i10_index || 8,
        sciePapersCount: 4,
        ieeeConferencesCount: 6,
        lastUpdated: scholarJson.last_updated || now,
        source: scholarJson.source || 'google_scholar'
      };
    } else {
      s = {
        citations: 172,
        hIndex: 8,
        i10Index: 8,
        sciePapersCount: 4,
        ieeeConferencesCount: 6,
        lastUpdated: now,
        source: 'google_scholar'
      };
    }
  }

  d1.rawDb.prepare(`
    INSERT INTO scholar_stats (
      id, citations, h_index, i10_index, scie_papers_count, ieee_conferences_count,
      last_updated, source, version, updated_at, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'scholarStats',
    s.citations || 0,
    s.hIndex || s.h_index || 0,
    s.i10Index || s.i10_index || 0,
    s.sciePapersCount || s.scie_papers_count || 0,
    s.ieeeConferencesCount || s.ieee_conferences_count || 0,
    s.lastUpdated || s.last_updated || now,
    s.source || 'google_scholar',
    s.version || 1,
    s.updatedAt || s.updated_at || now,
    s.metadata ? JSON.stringify(s.metadata) : null
  );

  // 4. Publications
  const insertPub = d1.rawDb.prepare(`
    INSERT INTO publications (
      id, code_number, title, authors, venue, publication_type, year, doi,
      external_url, pdf_asset_id, featured, published, display_order, version, created_at, updated_at, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const pub of snapshot.publications || []) {
    insertPub.run(
      pub.id,
      pub.codeNumber || pub.code_number || null,
      pub.title,
      pub.authors,
      pub.venue,
      pub.publicationType || pub.publication_type,
      pub.year,
      pub.doi || null,
      pub.externalUrl || pub.external_url || null,
      pub.pdfAssetId || pub.pdf_asset_id || null,
      pub.featured ? 1 : 0,
      pub.published !== undefined ? (pub.published ? 1 : 0) : 1,
      pub.displayOrder || pub.display_order || 10,
      pub.version || 1,
      pub.createdAt || pub.created_at || now,
      pub.updatedAt || pub.updated_at || now,
      pub.metadata ? JSON.stringify(pub.metadata) : null
    );
  }

  // 5. Talks
  const insertTalk = d1.rawDb.prepare(`
    INSERT INTO talks (id, title, venue, date_string, year, featured, published, display_order, version, created_at, updated_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const t of snapshot.talks || []) {
    insertTalk.run(
      t.id,
      t.title,
      t.venue,
      t.dateString || t.date_string || '',
      t.year,
      t.featured ? 1 : 0,
      t.published !== undefined ? (t.published ? 1 : 0) : 1,
      t.displayOrder || t.display_order || 10,
      t.version || 1,
      t.createdAt || t.created_at || now,
      t.updatedAt || t.updated_at || now,
      t.metadata ? JSON.stringify(t.metadata) : null
    );
  }

  // 6. Experience
  const insertExp = d1.rawDb.prepare(`
    INSERT INTO experience (id, role, organization, start_year, end_year, is_current, published, display_order, version, created_at, updated_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const e of snapshot.experience || []) {
    insertExp.run(
      e.id,
      e.role,
      e.organization,
      String(e.startYear || e.start_year),
      String(e.endYear || e.end_year),
      e.isCurrent ? 1 : 0,
      e.published !== undefined ? (e.published ? 1 : 0) : 1,
      e.displayOrder || e.display_order || 10,
      e.version || 1,
      e.createdAt || e.created_at || now,
      e.updatedAt || e.updated_at || now,
      e.metadata ? JSON.stringify(e.metadata) : null
    );
  }

  // 7. Education
  const insertEdu = d1.rawDb.prepare(`
    INSERT INTO education (id, degree, institution, year, thesis, published, display_order, version, created_at, updated_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const ed of snapshot.education || []) {
    insertEdu.run(
      ed.id,
      ed.degree,
      ed.institution,
      String(ed.year),
      ed.thesis || null,
      ed.published !== undefined ? (ed.published ? 1 : 0) : 1,
      ed.displayOrder || ed.display_order || 10,
      ed.version || 1,
      ed.createdAt || ed.created_at || now,
      ed.updatedAt || ed.updated_at || now,
      ed.metadata ? JSON.stringify(ed.metadata) : null
    );
  }

  // 8. Awards
  const insertAward = d1.rawDb.prepare(`
    INSERT INTO awards (id, title, organization, year, description, certificate_asset_id, published, display_order, version, created_at, updated_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const aw of snapshot.awards || []) {
    insertAward.run(
      aw.id,
      aw.title,
      aw.organization,
      String(aw.year),
      aw.description || null,
      aw.certificateAssetId || aw.certificate_asset_id || null,
      aw.published !== undefined ? (aw.published ? 1 : 0) : 1,
      aw.displayOrder || aw.display_order || 10,
      aw.version || 1,
      aw.createdAt || aw.created_at || now,
      aw.updatedAt || aw.updated_at || now,
      aw.metadata ? JSON.stringify(aw.metadata) : null
    );
  }

  // 9. Skills
  const insertSkill = d1.rawDb.prepare(`
    INSERT INTO skill_categories (id, category, skills_json, published, display_order, version, created_at, updated_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const sk of snapshot.skillCategories || snapshot.skill_categories || []) {
    insertSkill.run(
      sk.id,
      sk.category,
      JSON.stringify(sk.skills || []),
      sk.published !== undefined ? (sk.published ? 1 : 0) : 1,
      sk.displayOrder || sk.display_order || 10,
      sk.version || 1,
      sk.createdAt || sk.created_at || now,
      sk.updatedAt || sk.updated_at || now,
      sk.metadata ? JSON.stringify(sk.metadata) : null
    );
  }

  // 10. Social Links
  const insertSocial = d1.rawDb.prepare(`
    INSERT INTO social_links (id, platform, url, icon, visible, published, display_order, version, created_at, updated_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const sl of snapshot.socialLinks || snapshot.social_links || []) {
    insertSocial.run(
      sl.id,
      sl.platform,
      sl.url,
      sl.icon || null,
      sl.visible !== undefined ? (sl.visible ? 1 : 0) : 1,
      sl.published !== undefined ? (sl.published ? 1 : 0) : 1,
      sl.displayOrder || sl.display_order || 10,
      sl.version || 1,
      sl.createdAt || sl.created_at || now,
      sl.updatedAt || sl.updated_at || now,
      sl.metadata ? JSON.stringify(sl.metadata) : null
    );
  }

  // 11. Patents
  const insertPatent = d1.rawDb.prepare(`
    INSERT OR IGNORE INTO patents (id, title, domain, publication_date, application_number, published, display_order, version, created_at, updated_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const defaultPatents = [
    {
      id: 'pat-1',
      title: 'Intelli-Port: An Autonomous Multi-Functional Service Robot with Intelligent Navigation, Human Following, and Environmental Mapping',
      domain: 'Electronics',
      publication_date: '2026-07-31',
      application_number: '202641091778',
      display_order: 1
    },
    {
      id: 'pat-2',
      title: 'AI-Enabled Robotic Wardrobe System for Automated Garment Care',
      domain: 'Electronics',
      publication_date: '2026-02-13',
      application_number: '202641009664',
      display_order: 2
    }
  ];
  for (const pat of snapshot.patents || defaultPatents) {
    insertPatent.run(
      pat.id,
      pat.title,
      pat.domain,
      pat.publicationDate || pat.publication_date,
      pat.applicationNumber || pat.application_number,
      pat.published !== undefined ? (pat.published ? 1 : 0) : 1,
      pat.order || pat.display_order || 1,
      pat.version || 1,
      pat.createdAt || pat.created_at || now,
      pat.updatedAt || pat.updated_at || now,
      pat.metadata ? JSON.stringify(pat.metadata) : null
    );
  }

  // 12. Research Scholars
  const insertScholar = d1.rawDb.prepare(`
    INSERT OR IGNORE INTO research_scholars (id, name, scholar_id, badge, affiliation, guidance, published, display_order, version, created_at, updated_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const defaultScholars = [
    {
      id: 'rs-1',
      name: 'Ms. Shyla Moses',
      scholar_id: '251589001019',
      badge: 'Co-guided',
      affiliation: 'MAHE Bangalore',
      guidance: 'Co-guided by Dr. Lohith J.J.',
      display_order: 1
    },
    {
      id: 'rs-2',
      name: 'Ms. Bhavana Subhash Gujarkar',
      scholar_id: '252589001045',
      badge: 'Co-guided',
      affiliation: 'MAHE Bangalore',
      guidance: 'Co-guided by Dr. Lohith J.J.',
      display_order: 2
    }
  ];
  for (const rs of snapshot.researchScholars || snapshot.research_scholars || defaultScholars) {
    insertScholar.run(
      rs.id,
      rs.name,
      rs.scholarId || rs.scholar_id || null,
      rs.badge || 'Co-guided',
      rs.affiliation,
      rs.guidance || null,
      rs.published !== undefined ? (rs.published ? 1 : 0) : 1,
      rs.order || rs.display_order || 1,
      rs.version || 1,
      rs.createdAt || rs.created_at || now,
      rs.updatedAt || rs.updated_at || now,
      rs.metadata ? JSON.stringify(rs.metadata) : null
    );
  }
}
