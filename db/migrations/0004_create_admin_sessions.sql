-- ================================================================
-- 0004_create_admin_sessions.sql
-- D1 Admin Session Persistence & Token Hashing Foundation
-- ================================================================

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

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_hash ON admin_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_github_user ON admin_sessions(github_user_id);
