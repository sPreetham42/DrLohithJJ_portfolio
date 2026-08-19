import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { validateSnapshot } from './validate_snapshot.js';
import { normalizeSnapshot } from './normalize_snapshot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_PATH = path.join(__dirname, '..', 'current-portfolio-snapshot.json');

export function buildSqlStatements(snapshot) {
  const statements = [];
  const now = new Date().toISOString();
  const rawFile = fs.readFileSync(SNAPSHOT_PATH);
  const snapshotSha256 = crypto.createHash('sha256').update(rawFile).digest('hex');

  // 1. Profile
  const p = snapshot.profile;
  statements.push({
    table: 'profile',
    sql: `INSERT OR REPLACE INTO profile (
      id, name, credential, designation, years_experience, current_institution,
      hero_description_line1, hero_description_line2, email_primary, email_secondary,
      phone, address, photo_asset_id, additional_roles_json, professional_memberships_json,
      version, updated_at, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    params: [
      'profile',
      p.name,
      p.credential || null,
      p.designation,
      p.yearsExperience,
      p.currentInstitution,
      p.heroDescriptionLine1,
      p.heroDescriptionLine2,
      p.emailPrimary,
      p.emailSecondary || null,
      p.phone,
      p.address,
      p.photoAsset || null,
      JSON.stringify(p.additionalRoles),
      JSON.stringify(p.professionalMemberships),
      1,
      now,
      null
    ]
  });

  // 2. Scholar Stats
  const s = snapshot.scholarStats;
  statements.push({
    table: 'scholar_stats',
    sql: `INSERT OR REPLACE INTO scholar_stats (
      id, citations, h_index, i10_index, scie_papers_count, ieee_conferences_count,
      last_updated, source, version, updated_at, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    params: [
      'scholarStats',
      s.citations,
      s.hIndex,
      s.i10Index,
      s.sciePapersCount,
      s.ieeeConferencesCount,
      s.lastUpdated,
      s.source || 'google_scholar',
      1,
      now,
      null
    ]
  });

  // 3. Assets
  for (const a of snapshot.assets) {
    statements.push({
      table: 'assets',
      sql: `INSERT OR REPLACE INTO assets (
        id, storage_key, filename, mime_type, byte_size, is_primary_photo, created_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      params: [
        a.id,
        a.localPath,
        a.filename,
        a.mimeType,
        a.byteSize,
        a.isPrimaryPhoto ? 1 : 0,
        now,
        null
      ]
    });
  }

  // 4. Publications
  for (const pub of snapshot.publications) {
    statements.push({
      table: 'publications',
      sql: `INSERT OR REPLACE INTO publications (
        id, code_number, title, authors, venue, publication_type, year,
        doi, external_url, pdf_asset_id, featured, published, display_order,
        version, created_at, updated_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      params: [
        pub.id,
        pub.codeNumber || null,
        pub.title,
        pub.authors,
        pub.venue,
        pub.publicationType,
        pub.year,
        pub.doi || null,
        pub.externalUrl || null,
        null,
        pub.featured ? 1 : 0,
        1,
        pub.order,
        1,
        now,
        now,
        null
      ]
    });
  }

  // 5. Talks
  for (const t of snapshot.talks) {
    statements.push({
      table: 'talks',
      sql: `INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      params: [
        t.id,
        t.title,
        t.venue,
        t.dateString,
        t.year,
        t.featured ? 1 : 0,
        1,
        t.order,
        1,
        now,
        now,
        null
      ]
    });
  }

  // 6. Experience
  for (const exp of snapshot.experience) {
    statements.push({
      table: 'experience',
      sql: `INSERT OR REPLACE INTO experience (
        id, role, organization, start_year, end_year, is_current,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      params: [
        exp.id,
        exp.role,
        exp.organization,
        exp.startYear,
        exp.endYear,
        exp.isCurrent ? 1 : 0,
        1,
        exp.order,
        1,
        now,
        now,
        null
      ]
    });
  }

  // 7. Education
  for (const edu of snapshot.education) {
    statements.push({
      table: 'education',
      sql: `INSERT OR REPLACE INTO education (
        id, degree, institution, year, thesis, published,
        display_order, version, created_at, updated_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      params: [
        edu.id,
        edu.degree,
        edu.institution,
        edu.year,
        edu.thesis || null,
        1,
        edu.order,
        1,
        now,
        now,
        null
      ]
    });
  }

  // 8. Awards
  for (const aw of snapshot.awards) {
    statements.push({
      table: 'awards',
      sql: `INSERT OR REPLACE INTO awards (
        id, title, organization, year, description, certificate_asset_id,
        published, display_order, version, created_at, updated_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      params: [
        aw.id,
        aw.title,
        aw.organization,
        aw.year,
        aw.description || null,
        null,
        1,
        aw.order,
        1,
        now,
        now,
        null
      ]
    });
  }

  // 9. Skill Categories
  for (const sk of snapshot.skillCategories) {
    statements.push({
      table: 'skill_categories',
      sql: `INSERT OR REPLACE INTO skill_categories (
        id, category, skills_json, published, display_order,
        version, created_at, updated_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      params: [
        sk.id,
        sk.category,
        JSON.stringify(sk.skills),
        1,
        sk.order,
        1,
        now,
        now,
        null
      ]
    });
  }

  // 10. Social Links
  for (const sl of snapshot.socialLinks) {
    statements.push({
      table: 'social_links',
      sql: `INSERT OR REPLACE INTO social_links (
        id, platform, url, icon, display_order, visible,
        published, version, created_at, updated_at, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      params: [
        sl.id,
        sl.platform,
        sl.url,
        sl.icon,
        sl.order,
        sl.visible ? 1 : 0,
        1,
        1,
        now,
        now,
        null
      ]
    });
  }

  // 11. Initial Migration Baseline Revision Entry
  statements.push({
    table: 'revisions',
    sql: `INSERT INTO revisions (
      id, entity_type, entity_id, version, action, payload_json, author, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    params: [
      `rev-baseline-${snapshotSha256.substring(0, 12)}`,
      'migration_baseline',
      'snapshot-v1',
      1,
      'import',
      JSON.stringify({
        type: 'initial_import_baseline',
        snapshotVersion: snapshot.version,
        snapshotSha256,
        totalEntities: statements.length - 1
      }),
      'migration-runner',
      now
    ]
  });

  return statements;
}

export function runImport(isDryRun = false, options = {}) {
  const targetEnv = options.targetEnv || process.env.TARGET_ENV || 'local';
  console.log(`\n======================================================`);
  console.log(` D1 CANONICAL SNAPSHOT IMPORT RUNNER`);
  console.log(` Target Environment: ${targetEnv.toUpperCase()}`);
  console.log(` Mode: ${isDryRun ? 'DRY-RUN (No DB changes written)' : 'LIVE SEED'}`);
  console.log(`======================================================\n`);

  // Environment Safety Guard
  if (targetEnv === 'production') {
    if (!options.confirmProduction && !process.argv.includes('--confirm-production')) {
      throw new Error('SAFETY GATE: Target environment is PRODUCTION. Explicit flag --confirm-production is required to proceed.');
    }
  }

  const val = validateSnapshot(SNAPSHOT_PATH);
  if (!val.success) {
    throw new Error('Snapshot validation failed. Aborting import.');
  }

  const snapshot = normalizeSnapshot(SNAPSHOT_PATH);
  const statements = buildSqlStatements(snapshot);

  console.log(`[IMPORT] Generated ${statements.length} SQL import operations:`);
  const tableCounts = {};
  for (const s of statements) {
    tableCounts[s.table] = (tableCounts[s.table] || 0) + 1;
  }
  for (const [tbl, cnt] of Object.entries(tableCounts)) {
    console.log(`  • ${tbl.padEnd(20)}: ${cnt} records`);
  }

  if (isDryRun) {
    console.log('\n✅ [DRY RUN SUCCESS] All statements prepared and validated. 0 records modified.');
    return { success: true, isDryRun: true, statementsCount: statements.length, tableCounts };
  }

  return { success: true, isDryRun: false, statements, tableCounts };
}

if (process.argv[1] && process.argv[1].endsWith('import_d1.js')) {
  const isDryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
  const confirmProduction = process.argv.includes('--confirm-production');
  const targetEnv = process.env.TARGET_ENV || 'local';
  runImport(isDryRun, { targetEnv, confirmProduction });
}
