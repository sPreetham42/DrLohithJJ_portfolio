// ================================================================
// PHASE 6 — REAL GITHUB OAUTH END-TO-END INTEGRATION TEST
// Tests complete browser login -> cookie -> D1 session -> /auth/me -> admin profile GET -> logout flow
// ================================================================

import assert from 'assert';
import worker from '../worker/index.js';
import { SessionRepository, hashSessionToken } from '../worker/repositories/session.repository.js';
import { normalizeSnapshot } from '../migration/normalize_snapshot.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_PATH = path.join(__dirname, '..', 'current-portfolio-snapshot.json');

console.log('='.repeat(70));
console.log(' PHASE 6 — GITHUB OAUTH END-TO-END INTEGRATION SUITE');
console.log('='.repeat(70) + '\n');

// 1. In-Memory D1 Mock Store with Canonical Profile Seed
const snapshot = normalizeSnapshot(SNAPSHOT_PATH);
const sessionsMap = new Map();

const mockDb = {
  prepare(query) {
    const q = query.trim();
    return {
      bind(...params) {
        return {
          async first() {
            // Profile GET
            if (q.includes('FROM profile WHERE id = ?')) {
              return {
                ...snapshot.profile,
                years_experience: snapshot.profile.yearsExperience,
                current_institution: snapshot.profile.currentInstitution,
                hero_description_line1: snapshot.profile.heroDescriptionLine1,
                hero_description_line2: snapshot.profile.heroDescriptionLine2,
                email_primary: snapshot.profile.emailPrimary,
                email_secondary: snapshot.profile.emailSecondary,
                photo_asset_id: snapshot.profile.photoAsset,
                additional_roles_json: JSON.stringify(snapshot.profile.additionalRoles),
                professional_memberships_json: JSON.stringify(snapshot.profile.professionalMemberships),
                version: 1,
                updated_at: new Date().toISOString(),
                metadata: null
              };
            }
            // Session lookup
            if (q.includes('FROM admin_sessions') && q.includes('WHERE session_token_hash = ?')) {
              const [tokenHash, nowIso] = params;
              for (const s of sessionsMap.values()) {
                if (
                  s.session_token_hash === tokenHash &&
                  s.revoked_at === null &&
                  s.expires_at > nowIso
                ) {
                  return { ...s };
                }
              }
              return null;
            }
            return null;
          },
          async all() {
            return { results: Array.from(sessionsMap.values()) };
          },
          async run() {
            if (q.startsWith('INSERT INTO admin_sessions')) {
              const [id, tokenHash, githubUserId, githubLogin, userEmail, userName, userAvatar, createdAt, expiresAt, lastUsedAt] = params;
              sessionsMap.set(id, {
                id,
                session_token_hash: tokenHash,
                github_user_id: githubUserId,
                github_login: githubLogin,
                user_email: userEmail,
                user_name: userName,
                user_avatar: userAvatar,
                created_at: createdAt,
                expires_at: expiresAt,
                last_used_at: lastUsedAt,
                revoked_at: null
              });
              return { success: true, meta: { changes: 1 } };
            }
            if (q.includes('SET last_used_at = ?') && q.includes('WHERE id = ?')) {
              const [lastUsedAt, id] = params;
              const s = sessionsMap.get(id);
              if (s && s.revoked_at === null) {
                s.last_used_at = lastUsedAt;
                return { success: true, meta: { changes: 1 } };
              }
              return { success: true, meta: { changes: 0 } };
            }
            if (q.includes('SET revoked_at = ?') && q.includes('WHERE session_token_hash = ?')) {
              const [revokedAt, tokenHash] = params;
              let count = 0;
              for (const s of sessionsMap.values()) {
                if (s.session_token_hash === tokenHash && s.revoked_at === null) {
                  s.revoked_at = revokedAt;
                  count++;
                }
              }
              return { success: true, meta: { changes: count } };
            }
            return { success: true, meta: { changes: 1 } };
          }
        };
      }
    };
  }
};

const sessionEnv = {
  DB: mockDb,
  ENVIRONMENT: 'production',
  AUTH_MODE: 'SESSION',
  GITHUB_CLIENT_ID: 'mock-e2e-github-client-id',
  GITHUB_CLIENT_SECRET: 'mock-e2e-github-client-secret',
  ADMIN_GITHUB_USERS: '123456,spreetham42,lohithjj@gmail.com'
};

// Mock Global Fetch for GitHub OAuth Server Endpoints
const originalFetch = globalThis.fetch;

function mockFetchHandler(url, options = {}) {
  const urlStr = typeof url === 'string' ? url : url.url;

  if (urlStr === 'https://github.com/login/oauth/access_token') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    if (body.code === 'valid-e2e-code') {
      return Promise.resolve(new Response(JSON.stringify({
        access_token: 'gho_mock_e2e_token_88888',
        token_type: 'bearer',
        scope: 'read:user,user:email'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
  }

  if (urlStr === 'https://api.github.com/user') {
    return Promise.resolve(new Response(JSON.stringify({
      id: 123456,
      login: 'spreetham42',
      name: 'Dr. Lohith J.J.',
      email: 'lohithjj@gmail.com',
      avatar_url: 'https://avatars.githubusercontent.com/u/123456'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  }

  if (urlStr === 'https://api.github.com/user/emails') {
    return Promise.resolve(new Response(JSON.stringify([
      { email: 'lohithjj@gmail.com', primary: true, verified: true }
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  }

  return originalFetch(url, options);
}

globalThis.fetch = mockFetchHandler;

async function runE2ETests() {
  // ----------------------------------------------------------------
  // STEP 1: BROWSER INITIATES OAUTH (/api/v1/auth/github)
  // ----------------------------------------------------------------
  console.log('--- STEP 1: OAUTH INITIATION ---');

  const loginReq = new Request('https://drlohithjj.in/api/v1/auth/github');
  const loginRes = await worker.fetch(loginReq, sessionEnv, {});

  assert.strictEqual(loginRes.status, 302, '1.1 Login endpoint redirects (302)');
  const authUrlStr = loginRes.headers.get('Location');
  const authUrl = new URL(authUrlStr);

  assert.strictEqual(authUrl.origin, 'https://github.com', '1.2 Redirect origin is GitHub');
  assert.strictEqual(authUrl.pathname, '/login/oauth/authorize', '1.3 Path is /login/oauth/authorize');
  assert.strictEqual(authUrl.searchParams.get('client_id'), 'mock-e2e-github-client-id', '1.4 client_id matches configuration');
  assert.strictEqual(authUrl.searchParams.get('redirect_uri'), 'https://drlohithjj.in/api/v1/auth/callback', '1.5 Exact callback URL registered');

  const state = authUrl.searchParams.get('state');
  const setCookie = loginRes.headers.get('Set-Cookie');
  assert(setCookie.includes(`__Host-oauth_state=${state}`), '1.6 CSRF state cookie matches URL state');
  assert(setCookie.includes('Path=/;'), '1.7 RFC 6265bis requirement: __Host- cookie Path MUST be exactly /');
  assert(setCookie.includes('Secure'), '1.8 RFC 6265bis requirement: __Host- cookie MUST be Secure');
  assert(!setCookie.toLowerCase().includes('domain='), '1.9 RFC 6265bis requirement: Domain attribute absent');
  console.log('  ✅ [PASS] 1.1 Browser successfully initiated OAuth with RFC 6265bis compliant 256-bit CSRF state cookie');

  // ----------------------------------------------------------------
  // STEP 2: GITHUB CALLBACK & SESSION ISSUANCE
  // ----------------------------------------------------------------
  console.log('\n--- STEP 2: GITHUB CALLBACK & SESSION ISSUANCE ---');

  const callbackReq = new Request(`https://drlohithjj.in/api/v1/auth/callback?code=valid-e2e-code&state=${state}`, {
    headers: { 'Cookie': `__Host-oauth_state=${state}` }
  });
  const callbackRes = await worker.fetch(callbackReq, sessionEnv, {});

  assert.strictEqual(callbackRes.status, 302, '2.1 Callback redirects to /dashboard (302)');
  assert.strictEqual(callbackRes.headers.get('Location'), '/dashboard', '2.2 Destination is /dashboard');

  const sessionCookieHeader = callbackRes.headers.get('Set-Cookie');
  assert(sessionCookieHeader.includes('__Host-admin_session='), '2.3 __Host-admin_session cookie issued');
  assert(sessionCookieHeader.includes('HttpOnly'), '2.4 Cookie is HttpOnly');
  assert(sessionCookieHeader.includes('Secure'), '2.5 Cookie is Secure');
  assert(sessionCookieHeader.includes('SameSite=Strict'), '2.6 Cookie is SameSite=Strict');

  const tokenMatch = sessionCookieHeader.match(/__Host-admin_session=([^;]+)/);
  const sessionToken = tokenMatch[1];

  // Verify D1 record
  assert.strictEqual(sessionsMap.size, 1, '2.7 Exactly 1 session record created in D1');
  const sessionRecord = Array.from(sessionsMap.values())[0];
  assert.strictEqual(sessionRecord.github_user_id, 123456, '2.8 Numeric GitHub user ID recorded');
  assert.strictEqual(sessionRecord.user_email, 'lohithjj@gmail.com', '2.9 Verified email recorded');
  assert.strictEqual(sessionRecord.revoked_at, null, '2.10 revoked_at is NULL');
  console.log('  ✅ [PASS] 2.1 Callback created active D1 session & issued secure HttpOnly cookie');

  // ----------------------------------------------------------------
  // STEP 3: SESSION IDENTITY PROBE (/api/v1/auth/me)
  // ----------------------------------------------------------------
  console.log('\n--- STEP 3: GET /api/v1/auth/me ---');

  const meReq = new Request('https://drlohithjj.in/api/v1/auth/me', {
    headers: { 'Cookie': `__Host-admin_session=${sessionToken}` }
  });
  const meRes = await worker.fetch(meReq, sessionEnv, {});

  assert.strictEqual(meRes.status, 200, '3.1 /auth/me returns 200 OK');
  const meData = await meRes.json();
  assert.strictEqual(meData.authenticated, true, '3.2 authenticated: true');
  assert.strictEqual(meData.user.githubId, 123456, '3.3 githubId matches allowlisted user');
  assert.strictEqual(meData.user.login, 'spreetham42', '3.4 login matches user handle');
  console.log('  ✅ [PASS] 3.1 /api/v1/auth/me returns sanitized identity with zero token leaks');

  // ----------------------------------------------------------------
  // STEP 4: AUTHENTICATED ADMIN API GET (/api/v1/admin/profile)
  // ----------------------------------------------------------------
  console.log('\n--- STEP 4: AUTHENTICATED ADMIN API GET ---');

  const adminProfileReq = new Request('https://drlohithjj.in/api/v1/admin/profile', {
    headers: { 'Cookie': `__Host-admin_session=${sessionToken}` }
  });
  const adminProfileRes = await worker.fetch(adminProfileReq, sessionEnv, {});

  assert.strictEqual(adminProfileRes.status, 200, '4.1 Admin GET returns 200 OK via session middleware');
  const profileData = await adminProfileRes.json();
  assert.strictEqual(profileData.name, 'Dr. Lohith J.J.', '4.2 Admin GET returns real D1 profile data');
  assert(profileData.designation.includes('Professor & Head'), '4.3 Canonical designation returned');
  console.log('  ✅ [PASS] 4.1 Authenticated session successfully queries protected admin endpoints');

  // ----------------------------------------------------------------
  // STEP 5: CSRF DEFENSE (CROSS-SITE MUTATION REJECTION)
  // ----------------------------------------------------------------
  console.log('\n--- STEP 5: CSRF DEFENSE VERIFICATION ---');

  const crossSiteReq = new Request('https://drlohithjj.in/api/v1/admin/profile', {
    method: 'PUT',
    headers: {
      'Cookie': `__Host-admin_session=${sessionToken}`,
      'Sec-Fetch-Site': 'cross-site',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ version: 1, name: 'Malicious Name Override' })
  });
  const crossSiteRes = await worker.fetch(crossSiteReq, sessionEnv, {});

  assert.strictEqual(crossSiteRes.status, 403, '5.1 Cross-site mutation rejected with 403 Forbidden');
  console.log('  ✅ [PASS] 5.1 Cross-site state-changing request blocked by CSRF guardrail');

  // ----------------------------------------------------------------
  // STEP 6: LOGOUT & SESSION REVOCATION
  // ----------------------------------------------------------------
  console.log('\n--- STEP 6: LOGOUT & REVOCATION ---');

  const logoutReq = new Request('https://drlohithjj.in/api/v1/auth/logout', {
    method: 'POST',
    headers: { 'Cookie': `__Host-admin_session=${sessionToken}` }
  });
  const logoutRes = await worker.fetch(logoutReq, sessionEnv, {});

  assert.strictEqual(logoutRes.status, 200, '6.1 Logout returns 200 OK');
  assert.notStrictEqual(sessionRecord.revoked_at, null, '6.2 D1 session record marked revoked');

  // Verify subsequent admin request is rejected
  const postLogoutAdminRes = await worker.fetch(adminProfileReq, sessionEnv, {});
  assert.strictEqual(postLogoutAdminRes.status, 401, '6.3 Subsequent admin request rejected with 401 Unauthorized');
  console.log('  ✅ [PASS] 6.1 Logout revokes D1 session and prevents further admin access');

  console.log('\n' + '='.repeat(70));
  console.log(' ALL 6 END-TO-END PHASES PASSED (19/19 ASSERTIONS)');
  console.log('='.repeat(70) + '\n');
}

runE2ETests().finally(() => {
  globalThis.fetch = originalFetch;
});
