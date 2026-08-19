// ================================================================
// GITHUB OAUTH & SESSION HANDLERS (JS Mirror)
// Secure OAuth 2.0 authorization, state CSRF verification, and D1 session management
// ================================================================

import { UnauthorizedError, ForbiddenError, ValidationError, ApiError } from '../errors.js';
import { SessionRepository, hashSessionToken } from '../repositories/session.repository.js';
import { getNoCacheHeaders } from '../middleware/cache.js';
import { jsonResponse } from './public.handler.js';

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days
const OAUTH_STATE_MAX_AGE_SECONDS = 600; // 10 minutes

/**
 * Generates a cryptographically secure random hexadecimal token.
 * Uses Web Crypto API compatible with Cloudflare Workers and modern Node.js.
 */
export function generateRandomToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Parses the Cookie header from a Request.
 */
export function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;

  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const [name, ...rest] = pair.trim().split('=');
    if (name) {
      cookies[name.trim()] = decodeURIComponent(rest.join('=').trim());
    }
  }
  return cookies;
}

/**
 * 1. GET /api/v1/auth/github
 * Initiates the GitHub OAuth authorization flow with a cryptographic CSRF state.
 */
export async function handleAuthGithubLogin(request, env) {
  const clientId = env.GITHUB_CLIENT_ID;
  if (!clientId) {
    throw new ApiError(500, 'AUTH_CONFIG_ERROR', 'GITHUB_CLIENT_ID is not configured on the server');
  }

  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/v1/auth/callback`;
  const state = generateRandomToken(32);

  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'read:user user:email');
  authUrl.searchParams.set('state', state);

  const headers = new Headers();
  headers.set('Location', authUrl.toString());

  // SameSite=Lax is required for the cross-site redirect callback from GitHub
  // Path=/ is strictly required by RFC 6265bis for __Host- prefix cookies
  headers.append(
    'Set-Cookie',
    `__Host-oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${OAUTH_STATE_MAX_AGE_SECONDS}`
  );

  return new Response(null, {
    status: 302,
    headers
  });
}

/**
 * 2. GET /api/v1/auth/callback
 * Exchanges authorization code for GitHub access token, verifies user allowlist,
 * creates an active session in D1, and sets a secure HttpOnly session cookie.
 */
export async function handleAuthGithubCallback(request, env) {
  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new ApiError(500, 'AUTH_CONFIG_ERROR', 'GitHub OAuth credentials are not configured');
  }

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const cookies = parseCookies(request.headers.get('Cookie'));
  const storedState = cookies['__Host-oauth_state'] || cookies['oauth_state'];

  const clearStateCookie = `__Host-oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;

  // 1. CSRF State Verification
  if (!state || !storedState || state !== storedState) {
    const resHeaders = new Headers();
    resHeaders.append('Set-Cookie', clearStateCookie);
    throw new UnauthorizedError('Invalid or expired OAuth state parameter (CSRF protection)');
  }

  if (!code) {
    throw new ValidationError('Missing required OAuth authorization code parameter');
  }

  const redirectUri = `${url.origin}/api/v1/auth/callback`;

  // 2. Exchange Code for Access Token with GitHub
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'DrLohith-Portfolio-Auth'
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri
    })
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || tokenData.error || !tokenData.access_token) {
    throw new UnauthorizedError(`GitHub OAuth token exchange failed: ${tokenData.error_description || tokenData.error || 'Unknown error'}`);
  }

  const accessToken = tokenData.access_token;

  // 3. Fetch Authenticated GitHub User Profile
  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'DrLohith-Portfolio-Auth'
    }
  });

  if (!userRes.ok) {
    throw new UnauthorizedError('Failed to retrieve user profile from GitHub API');
  }

  const githubUser = await userRes.json();
  const githubUserId = Number(githubUser.id);
  const githubLogin = String(githubUser.login);

  if (!githubUserId || isNaN(githubUserId)) {
    throw new UnauthorizedError('Invalid GitHub user identity format returned from GitHub');
  }

  // 4. Fetch User Emails (to identify verified primary email)
  let userEmail = githubUser.email || null;
  try {
    const emailsRes = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'DrLohith-Portfolio-Auth'
      }
    });
    if (emailsRes.ok) {
      const emails = await emailsRes.json();
      if (Array.isArray(emails)) {
        const primary = emails.find(e => e.primary && e.verified);
        if (primary) {
          userEmail = primary.email;
        }
      }
    }
  } catch {
    // Non-fatal fallback
  }

  // 5. Authoritative Identity & Allowlist Enforcement
  const allowlistRaw = env.ADMIN_GITHUB_USERS || env.ADMIN_EMAILS || '';
  const allowlist = allowlistRaw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

  const numericIdStr = String(githubUserId);
  const loginStr = githubLogin.toLowerCase();
  const emailStr = userEmail ? userEmail.toLowerCase() : '';

  const isAllowed = allowlist.some(item => {
    return item === numericIdStr || item === loginStr || (emailStr && item === emailStr);
  });

  if (!isAllowed) {
    throw new ForbiddenError(`GitHub account '${githubLogin}' (ID: ${githubUserId}) is not in the authorized administrator allowlist`);
  }

  // 6. Generate High-Entropy Session & Store in D1
  const rawSessionToken = generateRandomToken(32);
  const sessionTokenHash = await hashSessionToken(rawSessionToken);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
  const sessionId = `sess-${Date.now()}-${generateRandomToken(8)}`;

  const sessionRepo = new SessionRepository(env.DB);
  await sessionRepo.createSession({
    id: sessionId,
    session_token_hash: sessionTokenHash,
    github_user_id: githubUserId,
    github_login: githubLogin,
    user_email: userEmail,
    user_name: githubUser.name || null,
    user_avatar: githubUser.avatar_url || null,
    expires_at: expiresAt,
    created_at: now.toISOString(),
    last_used_at: now.toISOString()
  });

  // 7. Issue HttpOnly Session Cookie & Redirect to /dashboard
  const headers = new Headers();
  headers.set('Location', '/dashboard');
  headers.append('Set-Cookie', clearStateCookie);
  headers.append(
    'Set-Cookie',
    `__Host-admin_session=${rawSessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MAX_AGE_SECONDS}`
  );

  return new Response(null, {
    status: 302,
    headers
  });
}

/**
 * 3. GET /api/v1/auth/me
 * Returns the authenticated admin identity for the current session.
 */
export async function handleAuthMe(request, env) {
  const cookies = parseCookies(request.headers.get('Cookie'));
  const rawToken = cookies['__Host-admin_session'] || cookies['portfolio_admin_session'];

  if (!rawToken) {
    return jsonResponse(
      {
        authenticated: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No active admin session found'
        }
      },
      401,
      getNoCacheHeaders()
    );
  }

  const tokenHash = await hashSessionToken(rawToken);
  const sessionRepo = new SessionRepository(env.DB);
  const session = await sessionRepo.getSessionByTokenHash(tokenHash);

  if (!session) {
    return jsonResponse(
      {
        authenticated: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Session is invalid, expired, or has been revoked'
        }
      },
      401,
      getNoCacheHeaders()
    );
  }

  // Update last_used_at timestamp
  await sessionRepo.updateLastUsedAt(session.id);

  return jsonResponse(
    {
      authenticated: true,
      user: {
        githubId: session.github_user_id,
        login: session.github_login,
        email: session.user_email,
        name: session.user_name,
        avatarUrl: session.user_avatar
      }
    },
    200,
    getNoCacheHeaders()
  );
}

/**
 * 4. POST /api/v1/auth/logout
 * Revokes the server-side D1 session and clears the session cookie.
 */
export async function handleAuthLogout(request, env) {
  const cookies = parseCookies(request.headers.get('Cookie'));
  const rawToken = cookies['__Host-admin_session'] || cookies['portfolio_admin_session'];

  if (rawToken) {
    try {
      const tokenHash = await hashSessionToken(rawToken);
      const sessionRepo = new SessionRepository(env.DB);
      await sessionRepo.revokeSessionByTokenHash(tokenHash);
    } catch {
      // Non-fatal if DB revocation fails on logout
    }
  }

  const headers = new Headers();
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  headers.append(
    'Set-Cookie',
    '__Host-admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  );

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Logged out successfully'
    }),
    {
      status: 200,
      headers
    }
  );
}
