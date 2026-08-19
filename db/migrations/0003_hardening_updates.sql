-- ================================================================
-- 0003_hardening_updates.sql
-- Composite Indexes, Idempotency Tracking & Hardened Constraints
-- ================================================================

-- 1. Scholar Sync Idempotency Tracking Table
CREATE TABLE IF NOT EXISTS scholar_sync_runs (
  sync_run_id TEXT PRIMARY KEY,
  citations INTEGER NOT NULL,
  h_index INTEGER NOT NULL,
  i10_index INTEGER NOT NULL,
  payload_sha256 TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scholar_sync_created ON scholar_sync_runs(created_at DESC);

-- 2. Composite Query Indexes for Public Read Performance
CREATE INDEX IF NOT EXISTS idx_pub_published_order ON publications(published, display_order ASC, year DESC);
CREATE INDEX IF NOT EXISTS idx_talks_published_year_order ON talks(published, year DESC, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_exp_published_order ON experience(published, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_edu_published_order ON education(published, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_awards_published_order ON awards(published, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_skills_published_order ON skill_categories(published, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_social_published_order ON social_links(published, visible, display_order ASC);
