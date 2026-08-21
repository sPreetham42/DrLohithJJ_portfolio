// ================================================================
// CLOUDFLARE WORKERS RUNTIME TEST SETUP HELPER
// Applies versioned D1 migrations (0001-0005) and seeds deterministic
// test fixtures on the real local Cloudflare D1Database binding.
// ================================================================

import { hashSessionToken } from '../../../worker/repositories/session.repository';

// Migration scripts in sequential order
const MIGRATION_0001 = `
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  storage_key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL DEFAULT 0,
  is_primary_photo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS profile (
  id TEXT PRIMARY KEY DEFAULT 'profile',
  name TEXT NOT NULL,
  credential TEXT,
  designation TEXT NOT NULL,
  years_experience INTEGER NOT NULL DEFAULT 0,
  current_institution TEXT NOT NULL,
  hero_description_line1 TEXT NOT NULL,
  hero_description_line2 TEXT NOT NULL,
  email_primary TEXT NOT NULL,
  email_secondary TEXT,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  photo_asset_id TEXT REFERENCES assets(id),
  additional_roles_json TEXT NOT NULL DEFAULT '[]',
  professional_memberships_json TEXT NOT NULL DEFAULT '[]',
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS scholar_stats (
  id TEXT PRIMARY KEY DEFAULT 'scholarStats',
  citations INTEGER NOT NULL DEFAULT 0,
  h_index INTEGER NOT NULL DEFAULT 0,
  i10_index INTEGER NOT NULL DEFAULT 0,
  scie_papers_count INTEGER NOT NULL DEFAULT 0,
  ieee_conferences_count INTEGER NOT NULL DEFAULT 0,
  last_updated TEXT NOT NULL DEFAULT (datetime('now')),
  source TEXT NOT NULL DEFAULT 'google_scholar',
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS publications (
  id TEXT PRIMARY KEY,
  code_number TEXT,
  title TEXT NOT NULL,
  authors TEXT NOT NULL,
  venue TEXT NOT NULL,
  publication_type TEXT NOT NULL CHECK (publication_type IN ('journal', 'conference', 'book')),
  year INTEGER NOT NULL,
  doi TEXT,
  external_url TEXT,
  pdf_asset_id TEXT REFERENCES assets(id),
  featured INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS talks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  venue TEXT NOT NULL,
  date_string TEXT NOT NULL,
  year INTEGER NOT NULL,
  featured INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS experience (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  organization TEXT NOT NULL,
  start_year TEXT NOT NULL,
  end_year TEXT NOT NULL,
  is_current INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS education (
  id TEXT PRIMARY KEY,
  degree TEXT NOT NULL,
  institution TEXT NOT NULL,
  year TEXT NOT NULL,
  thesis TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS awards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  year TEXT NOT NULL,
  description TEXT,
  certificate_asset_id TEXT REFERENCES assets(id),
  published INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS skill_categories (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  skills_json TEXT NOT NULL DEFAULT '[]',
  published INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS social_links (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  visible INTEGER NOT NULL DEFAULT 1,
  published INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT
);
`;

const MIGRATION_0002 = `
CREATE TABLE IF NOT EXISTS revisions (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  payload_json TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_revisions_entity ON revisions (entity_type, entity_id);
`;

const MIGRATION_0003 = `
CREATE INDEX IF NOT EXISTS idx_pubs_published_order ON publications (published, display_order);
CREATE INDEX IF NOT EXISTS idx_talks_published_order ON talks (published, display_order);
CREATE INDEX IF NOT EXISTS idx_awards_published_order ON awards (published, display_order);
CREATE INDEX IF NOT EXISTS idx_exp_published_order ON experience (published, display_order);

CREATE TABLE IF NOT EXISTS scholar_sync_runs (
  id TEXT PRIMARY KEY,
  citations INTEGER NOT NULL,
  h_index INTEGER NOT NULL,
  i10_index INTEGER NOT NULL,
  last_updated TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

const MIGRATION_0004 = `
CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  session_token_hash TEXT NOT NULL UNIQUE,
  github_user_id INTEGER NOT NULL,
  github_login TEXT NOT NULL,
  user_email TEXT,
  user_name TEXT,
  user_avatar TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_used_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_hash ON admin_sessions (session_token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_github_user ON admin_sessions (github_user_id);
`;

const MIGRATION_0005 = `
-- Migration 0005: Normalized photo_asset_id references
UPDATE profile
SET photo_asset_id = (SELECT id FROM assets WHERE is_primary_photo = 1 LIMIT 1)
WHERE photo_asset_id IS NOT NULL
  AND photo_asset_id NOT IN (SELECT id FROM assets)
  AND EXISTS (SELECT 1 FROM assets WHERE is_primary_photo = 1);
`;

export async function executeSqlStatements(db: D1Database, sql: string): Promise<void> {
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    await db.prepare(statement).run();
  }
}

export async function applyWorkerMigrations(db: D1Database): Promise<void> {
  await executeSqlStatements(db, MIGRATION_0001);
  await executeSqlStatements(db, MIGRATION_0002);
  await executeSqlStatements(db, MIGRATION_0003);
  await executeSqlStatements(db, MIGRATION_0004);
  await executeSqlStatements(db, MIGRATION_0005);
}

export const WORKER_TEST_SESSION_RAW = 'workers-runtime-test-session-token-998877';

export async function seedWorkerFixtures(db: D1Database): Promise<void> {
  const now = new Date().toISOString();

  // 1. Asset
  await db
    .prepare(`
      INSERT OR REPLACE INTO assets (id, storage_key, filename, mime_type, byte_size, is_primary_photo, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .bind('asset-headshot', 'assets/Dr Lohith J J.jpeg', 'Dr Lohith J J.jpeg', 'image/jpeg', 266676, 1, now)
    .run();

  // 2. Profile
  await db
    .prepare(`
      INSERT OR REPLACE INTO profile (
        id, name, credential, designation, years_experience, current_institution,
        hero_description_line1, hero_description_line2, email_primary, email_secondary,
        phone, address, photo_asset_id, additional_roles_json, professional_memberships_json,
        version, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      'profile',
      'Dr. Lohith J.J.',
      'Ph.D. · National Institute of Technology, Tiruchirappalli',
      'Professor & Head of Department — CSE (IoT & Cybersecurity including Blockchain Technology)',
      20,
      'Nagarjuna College of Engineering and Technology (NCET), Bengaluru',
      'Professor and Head of Department — CSE (IoT & Cybersecurity including Blockchain Technology)...',
      'Doctoral research from NIT Tiruchirappalli...',
      'lohithjj@gmail.com',
      'hod-cse@ncetmail.com',
      '+91-9886745882',
      'Bengaluru, Karnataka, India',
      'asset-headshot',
      JSON.stringify(['Guest Faculty — BITS Pilani', 'Board of Studies Member']),
      JSON.stringify(['Senior Member — IEEE', 'Life Member — CRSI']),
      1,
      now
    )
    .run();

  // 3. Scholar Stats
  await db
    .prepare(`
      INSERT OR REPLACE INTO scholar_stats (
        id, citations, h_index, i10_index, scie_papers_count, ieee_conferences_count,
        last_updated, source, version, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind('scholarStats', 172, 8, 8, 4, 6, now, 'google_scholar', 1, now)
    .run();

  // 4. Publications (pub-j1 and pub-j2)
  await db
    .prepare(`
      INSERT OR REPLACE INTO publications (
        id, code_number, title, authors, venue, publication_type, year, doi,
        external_url, pdf_asset_id, featured, published, display_order, version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      'pub-j1',
      'J1',
      'A Novel Static Analysis Tool to Detect Timestamp Dependency Vulnerabilities in Ethereum Smart Contracts',
      'Lohith, J. J., & Eswari, R.',
      'IEEE Access (SCIE, IF: 3.4, Q1)',
      'journal',
      2024,
      '10.1109/ACCESS.2024.3411075',
      'https://doi.org/10.1109/ACCESS.2024.3411075',
      null,
      1,
      1,
      1,
      1,
      now,
      now
    )
    .run();

  // 5. Talk
  await db
    .prepare(`
      INSERT OR REPLACE INTO talks (
        id, title, venue, date_string, year, featured, published, display_order, version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      'talk-1',
      'Smart Contract Security and Blockchain Vulnerabilities',
      'NIT Tiruchirappalli FDP',
      'July 2024',
      2024,
      1,
      1,
      1,
      1,
      now,
      now
    )
    .run();

  // 6. Admin Session
  const tokenHash = await hashSessionToken(WORKER_TEST_SESSION_RAW);
  await db
    .prepare(`
      INSERT OR REPLACE INTO admin_sessions (
        id, session_token_hash, github_user_id, github_login,
        user_email, user_name, created_at, expires_at, last_used_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      'workers-sess-1',
      tokenHash,
      175527963,
      'lohithjj',
      'lohithjj@gmail.com',
      'Dr. Lohith J.J.',
      now,
      new Date(Date.now() + 3600000).toISOString(),
      now
    )
    .run();
}
