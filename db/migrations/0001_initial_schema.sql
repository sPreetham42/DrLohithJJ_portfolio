-- ================================================================
-- 0001_initial_schema.sql
-- Core D1 Relational Schema for Dr. Lohith J.J. Portfolio
-- ================================================================

-- 1. Profile (Singleton)
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
  photo_asset_id TEXT,
  additional_roles_json TEXT NOT NULL DEFAULT '[]',
  professional_memberships_json TEXT NOT NULL DEFAULT '[]',
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  metadata TEXT,
  FOREIGN KEY (photo_asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

-- 2. Google Scholar Statistics (Singleton)
CREATE TABLE IF NOT EXISTS scholar_stats (
  id TEXT PRIMARY KEY DEFAULT 'scholarStats',
  citations INTEGER NOT NULL DEFAULT 0,
  h_index INTEGER NOT NULL DEFAULT 0,
  i10_index INTEGER NOT NULL DEFAULT 0,
  scie_papers_count INTEGER NOT NULL DEFAULT 0,
  ieee_conferences_count INTEGER NOT NULL DEFAULT 0,
  last_updated TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'google_scholar',
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  metadata TEXT
);

-- 3. Assets
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  storage_key TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  is_primary_photo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  metadata TEXT
);

-- 4. Publications
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
  pdf_asset_id TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 10,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  metadata TEXT,
  FOREIGN KEY (pdf_asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

-- 5. Invited Talks & Workshops
CREATE TABLE IF NOT EXISTS talks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  venue TEXT NOT NULL,
  date_string TEXT NOT NULL,
  year INTEGER NOT NULL,
  featured INTEGER NOT NULL DEFAULT 1,
  published INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 10,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  metadata TEXT
);

-- 6. Employment Experience
CREATE TABLE IF NOT EXISTS experience (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  organization TEXT NOT NULL,
  start_year TEXT NOT NULL,
  end_year TEXT NOT NULL,
  is_current INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 10,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  metadata TEXT
);

-- 7. Education
CREATE TABLE IF NOT EXISTS education (
  id TEXT PRIMARY KEY,
  degree TEXT NOT NULL,
  institution TEXT NOT NULL,
  year TEXT NOT NULL,
  thesis TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 10,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  metadata TEXT
);

-- 8. Achievements & Awards
CREATE TABLE IF NOT EXISTS awards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  year TEXT NOT NULL,
  description TEXT,
  certificate_asset_id TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 10,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  metadata TEXT,
  FOREIGN KEY (certificate_asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

-- 9. Skill Categories
CREATE TABLE IF NOT EXISTS skill_categories (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  skills_json TEXT NOT NULL DEFAULT '[]',
  published INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 10,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  metadata TEXT
);

-- 10. Social Links
CREATE TABLE IF NOT EXISTS social_links (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 10,
  visible INTEGER NOT NULL DEFAULT 1,
  published INTEGER NOT NULL DEFAULT 1,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  metadata TEXT
);

-- ================================================================
-- PERFORMANCE & FILTERING INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_publications_order ON publications(display_order ASC, year DESC);
CREATE INDEX IF NOT EXISTS idx_publications_type ON publications(publication_type);
CREATE INDEX IF NOT EXISTS idx_talks_year_order ON talks(year DESC, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_experience_order ON experience(display_order ASC);
CREATE INDEX IF NOT EXISTS idx_education_order ON education(display_order ASC);
CREATE INDEX IF NOT EXISTS idx_awards_order ON awards(display_order ASC);
CREATE INDEX IF NOT EXISTS idx_skills_order ON skill_categories(display_order ASC);
CREATE INDEX IF NOT EXISTS idx_social_order ON social_links(display_order ASC);
