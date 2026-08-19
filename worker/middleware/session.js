// ================================================================
// D1 ADMIN SESSION AUTHENTICATION MIDDLEWARE (JS Mirror)
// Validates __Host-admin_session cookie against remote D1 storage
// ================================================================

import { UnauthorizedError } from '../errors.js';
import { SessionRepository, hashSessionToken } from '../repositories/session.repository.js';
import { parseCookies } from '../handlers/auth.handler.js';

/**
 * Extracts the raw session cookie from the Request.
 * Supports __Host-admin_session (production) and portfolio_admin_session (local dev fallback).
 */
export function extractSessionToken(request) {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const cookies = parseCookies(cookieHeader);
  return cookies['__Host-admin_session'] || cookies['portfolio_admin_session'] || null;
}

/**
 * Authenticates an incoming request using the D1 admin_sessions store.
 * Validates session token hash, verifies expiry and revocation status,
 * updates the last_used_at timestamp, and maps identity to AuthenticatedUser.
 */
export async function authenticateAdminSession(request, env) {
  const rawToken = extractSessionToken(request);
  if (!rawToken) {
    throw new UnauthorizedError('Missing required admin session cookie (__Host-admin_session)');
  }

  // 1. Compute SHA-256 Hash of the Opaque Token
  const tokenHash = await hashSessionToken(rawToken);

  // 2. Query Active Session in D1
  const sessionRepo = new SessionRepository(env.DB);
  const session = await sessionRepo.getSessionByTokenHash(tokenHash);

  if (!session) {
    throw new UnauthorizedError('Admin session is invalid, expired, or has been revoked');
  }

  // 3. Update Last-Used Timestamp (Non-fatal if update fails)
  try {
    await sessionRepo.updateLastUsedAt(session.id);
  } catch (err) {
    console.error('[SESSION_MIDDLEWARE] Failed to update session last_used_at:', err);
  }

  // 4. Adapt to Unified AuthenticatedUser Contract
  return {
    email: session.user_email || `${session.github_login}@github.com`,
    sub: String(session.github_user_id),
    name: session.user_name || session.github_login,
    githubId: session.github_user_id,
    login: session.github_login,
    avatarUrl: session.user_avatar
  };
}
