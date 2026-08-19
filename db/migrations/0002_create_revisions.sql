-- ================================================================
-- 0002_create_revisions.sql
-- Audit log and optimistic concurrency revision tracking
-- ================================================================

CREATE TABLE IF NOT EXISTS revisions (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'import')),
  payload_json TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'system',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_revisions_entity ON revisions(entity_type, entity_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_revisions_created ON revisions(created_at DESC);
