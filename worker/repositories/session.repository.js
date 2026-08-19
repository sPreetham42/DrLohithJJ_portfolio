// ================================================================
// D1 ADMIN SESSION REPOSITORY (JS Mirror)
// High-performance session persistence with Web Crypto SHA-256 token hashing
// ================================================================

/**
 * Computes a standard SHA-256 hexadecimal hash using Web Crypto API.
 * Compatible with Cloudflare Workers runtime and Node.js 18+ (crypto.subtle).
 */
export async function hashSessionToken(rawToken) {
  const encoder = new TextEncoder();
  const data = encoder.encode(rawToken);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export class SessionRepository {
  constructor(db) {
    this.db = db;
  }

  /**
   * Persists a new active admin session. Token must already be hashed.
   */
  async createSession(data) {
    const now = new Date().toISOString();
    const createdAt = data.created_at || now;
    const lastUsedAt = data.last_used_at || now;

    await this.db
      .prepare(`
        INSERT INTO admin_sessions (
          id, session_token_hash, github_user_id, github_login,
          user_email, user_name, user_avatar, created_at,
          expires_at, last_used_at, revoked_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
      `)
      .bind(
        data.id,
        data.session_token_hash,
        data.github_user_id,
        data.github_login,
        data.user_email || null,
        data.user_name || null,
        data.user_avatar || null,
        createdAt,
        data.expires_at,
        lastUsedAt
      )
      .run();

    return {
      id: data.id,
      session_token_hash: data.session_token_hash,
      github_user_id: data.github_user_id,
      github_login: data.github_login,
      user_email: data.user_email || null,
      user_name: data.user_name || null,
      user_avatar: data.user_avatar || null,
      created_at: createdAt,
      expires_at: data.expires_at,
      last_used_at: lastUsedAt,
      revoked_at: null
    };
  }

  /**
   * Retrieves an active, non-expired, non-revoked session by its SHA-256 token hash.
   */
  async getSessionByTokenHash(tokenHash, nowIso) {
    const now = nowIso || new Date().toISOString();
    return await this.db
      .prepare(`
        SELECT * FROM admin_sessions
        WHERE session_token_hash = ?
          AND revoked_at IS NULL
          AND expires_at > ?
      `)
      .bind(tokenHash, now)
      .first();
  }

  /**
   * Updates last_used_at timestamp on an active session.
   */
  async updateLastUsedAt(id, nowIso) {
    const now = nowIso || new Date().toISOString();
    await this.db
      .prepare(`
        UPDATE admin_sessions
        SET last_used_at = ?
        WHERE id = ? AND revoked_at IS NULL
      `)
      .bind(now, id)
      .run();
  }

  /**
   * Revokes an active session by session ID (soft-delete audit trail).
   */
  async revokeSession(id, nowIso) {
    const now = nowIso || new Date().toISOString();
    await this.db
      .prepare(`
        UPDATE admin_sessions
        SET revoked_at = ?
        WHERE id = ? AND revoked_at IS NULL
      `)
      .bind(now, id)
      .run();
  }

  /**
   * Revokes an active session by token hash.
   */
  async revokeSessionByTokenHash(tokenHash, nowIso) {
    const now = nowIso || new Date().toISOString();
    await this.db
      .prepare(`
        UPDATE admin_sessions
        SET revoked_at = ?
        WHERE session_token_hash = ? AND revoked_at IS NULL
      `)
      .bind(now, tokenHash)
      .run();
  }

  /**
   * Deletes expired or revoked sessions to prevent database bloat.
   */
  async deleteExpiredSessions(nowIso) {
    const now = nowIso || new Date().toISOString();
    const result = await this.db
      .prepare(`
        DELETE FROM admin_sessions
        WHERE expires_at <= ? OR revoked_at IS NOT NULL
      `)
      .bind(now)
      .run();

    return result.meta?.changes || 0;
  }
}
