-- ================================================================
-- 0006_create_patents_and_research_scholars.sql
-- Relational Schema & Seed Data for Patents & Research Scholars
-- ================================================================

-- 1. Patents
CREATE TABLE IF NOT EXISTS patents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  publication_date TEXT NOT NULL,
  application_number TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 10,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  metadata TEXT
);

-- 2. Research Scholars
CREATE TABLE IF NOT EXISTS research_scholars (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  scholar_id TEXT,
  badge TEXT NOT NULL DEFAULT 'Co-guided',
  affiliation TEXT NOT NULL,
  guidance TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 10,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  metadata TEXT
);

-- ================================================================
-- INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_patents_order ON patents(display_order ASC, publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_research_scholars_order ON research_scholars(display_order ASC);

-- ================================================================
-- SEED DATA
-- ================================================================

-- Seed Patents
INSERT OR IGNORE INTO patents (
  id, title, domain, publication_date, application_number, published, display_order, version, created_at, updated_at
) VALUES 
('pat-1', 'Intelli-Port: An Autonomous Multi-Functional Service Robot with Intelligent Navigation, Human Following, and Environmental Mapping', 'Electronics', '2026-07-31', '202641091778', 1, 1, 1, '2026-08-26T00:00:00.000Z', '2026-08-26T00:00:00.000Z'),
('pat-2', 'AI-Enabled Robotic Wardrobe System for Automated Garment Care', 'Electronics', '2026-02-13', '202641009664', 1, 2, 1, '2026-08-26T00:00:00.000Z', '2026-08-26T00:00:00.000Z');

-- Seed Research Scholars
INSERT OR IGNORE INTO research_scholars (
  id, name, scholar_id, badge, affiliation, guidance, published, display_order, version, created_at, updated_at
) VALUES 
('rs-1', 'Ms. Shyla Moses', '251589001019', 'Co-guided', 'MAHE Bangalore', 'Co-guided by Dr. Lohith J.J.', 1, 1, 1, '2026-08-26T00:00:00.000Z', '2026-08-26T00:00:00.000Z'),
('rs-2', 'Ms. Bhavana Subhash Gujarkar', '252589001045', 'Co-guided', 'MAHE Bangalore', 'Co-guided by Dr. Lohith J.J.', 1, 2, 1, '2026-08-26T00:00:00.000Z', '2026-08-26T00:00:00.000Z');
