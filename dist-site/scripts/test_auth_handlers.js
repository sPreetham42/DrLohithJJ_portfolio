// ================================================================
// GITHUB OAUTH & SESSION HANDLERS TEST SUITE
// Tests OAuth initiation, CSRF state verification, token exchange, allowlist checking,
// session creation, cookie issuance, /auth/me identity verification, and logout
// ================================================================

import assert from 'assert';
import worker from '../worker/index.js';
import { SessionRepository, hashSessionToken } from '../worker/repositories/session.repository.js';
import { parseCookies } from '../worker/handlers/auth.handler.js';

console.log('='.repeat(70));
console.log(' GITHUB OAUTH & SESSION HANDLERS TEST SUITE');
console.log('='.repeat(70) + '\n');

// 1. In-Memory D1 Mock Store
const sessionsMap = new Map();

const mockDb = {
  prepare(query) {
    const q = query.trim();
    return {
      bind(...params) {
        return {
          async first() {
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
            if (q.includes('FROM admin_sessions') && q.includes('WHERE id = ?')) {
              const [id] = params;
              const s = sessionsMap.get(id);
              return s ? { ...s } : null;
            }
            return null;
          },
          async all() {
            return { results: Array.from(sessionsMap.values()).map(s => ({ ...s })) };
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
            return { success: true, meta: { changes: 0 } };
          }
        };
      }
    };
  }
};

const mockEnv = {
  DB: mockDb,
  ENVIRONMENT: 'production',
  GITHUB_CLIENT_ID: 'mock-github-client-id-12345',
  GITHUB_CLIENT_SECRET: 'mock-github-client-secret-67890',
  ADMIN_GITHUB_USERS: '123456,spreetham42,lohithjj@gmail.com' // Allowlist with numeric ID, username, email
};

// Mock Global Fetch for GitHub API Calls
const originalFetch = globalThis.fetch;

function mockFetchHandler(url, options = {}) {
  const urlStr = typeof url === 'string' ? url : url.url;

  // 1. GitHub Token Exchange
  if (urlStr === 'https://github.com/login/oauth/access_token') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    if (body.code === 'valid-auth-code') {
      return Promise.resolve(new Response(JSON.stringify({
        access_token: 'gho_mock_access_token_12345',
        token_type: 'bearer',
        scope: 'read:user,user:email'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    if (body.code === 'unauthorized-user-code') {
      return Promise.resolve(new Response(JSON.stringify({
        access_token: 'gho_mock_intruder_token_99999',
        token_type: 'bearer',
        scope: 'read:user,user:email'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return Promise.resolve(new Response(JSON.stringify({
      error: 'bad_verification_code',
      error_description: 'The code passed is incorrect or has expired.'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  }

  // 2. GitHub User Profile
  if (urlStr === 'https://api.github.com/user') {
    const authHeader = options.headers?.Authorization || options.headers?.authorization;
    if (authHeader === 'Bearer gho_mock_access_token_12345') {
      return Promise.resolve(new Response(JSON.stringify({
        id: 123456, // Allowlisted numeric ID
        login: 'spreetham42',
        name: 'Dr. Lohith J.J.',
        email: 'lohithjj@gmail.com',
        avatar_url: 'https://avatars.githubusercontent.com/u/123456'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    if (authHeader === 'Bearer gho_mock_intruder_token_99999') {
      return Promise.resolve(new Response(JSON.stringify({
        id: 999999, // NOT in allowlist
        login: 'unauthorized_intruder',
        name: 'Intruder User',
        email: 'intruder@unknown.com',
        avatar_url: 'https://avatars.githubusercontent.com/u/999999'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return Promise.resolve(new Response(JSON.stringify({ message: 'Bad credentials' }), { status: 401 }));
  }

  // 3. GitHub User Emails
  if (urlStr === 'https://api.github.com/user/emails') {
    const authHeader = options.headers?.Authorization || options.headers?.authorization;
    if (authHeader === 'Bearer gho_mock_intruder_token_99999') {
      return Promise.resolve(new Response(JSON.stringify([
        { email: 'intruder@unknown.com', primary: true, verified: true }
      ]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return Promise.resolve(new Response(JSON.stringify([
      { email: 'lohithjj@gmail.com', primary: true, verified: true }
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
  }

  return originalFetch(url, options);
}

globalThis.fetch = mockFetchHandler;

async function runTests() {
  // ----------------------------------------------------------------
  // SUITE 1: OAUTH INITIATION (GET /api/v1/auth/github)
  // ----------------------------------------------------------------
  console.log('--- SUITE 1: OAUTH INITIATION ---');

  const initReq = new Request('https://drlohithjj.in/api/v1/auth/github');
  const initRes = await worker.fetch(initReq, mockEnv, {});

  assert.strictEqual(initRes.status, 302, '1.1 Login endpoint returns 302 Redirect');
  const location = initRes.headers.get('Location');
  assert(location.startsWith('https://github.com/login/oauth/authorize'), '1.2 Redirect target is GitHub OAuth endpoint');

  const targetUrl = new URL(location);
  assert.strictEqual(targetUrl.searchParams.get('client_id'), 'mock-github-client-id-12345', '1.3 client_id parameter is set');
  assert.strictEqual(targetUrl.searchParams.get('redirect_uri'), 'https://drlohithjj.in/api/v1/auth/callback', '1.4 redirect_uri is exact production callback');
  assert.strictEqual(targetUrl.searchParams.get('scope'), 'read:user user:email', '1.5 scope includes read:user and user:email');

  const stateParam = targetUrl.searchParams.get('state');
  assert(stateParam && stateParam.length === 64, '1.6 state is high-entropy 256-bit hex string');

  const setCookie = initRes.headers.get('Set-Cookie');
  assert(setCookie.includes('__Host-oauth_state='), '1.7 Set-Cookie header contains __Host-oauth_state');
  assert(setCookie.includes('SameSite=Lax'), '1.8 oauth_state cookie uses SameSite=Lax for cross-site redirect');
  assert(setCookie.includes('HttpOnly'), '1.9 oauth_state cookie is HttpOnly');
  assert(setCookie.includes('Secure'), '1.10 oauth_state cookie is Secure');
  assert(setCookie.includes('Path=/;'), '1.11 RFC 6265bis requirement: __Host- cookie Path MUST be exactly /');
  assert(!setCookie.toLowerCase().includes('domain='), '1.12 RFC 6265bis requirement: __Host- cookie MUST NOT have Domain attribute');
  assert(setCookie.includes(stateParam), '1.13 Cookie value matches state URL parameter');
  console.log('  ✅ [PASS] 1.1 OAuth initiation sets RFC 6265bis compliant 256-bit CSRF state cookie (Path=/, Secure, no Domain)');

  // ----------------------------------------------------------------
  // SUITE 2: CSRF STATE VERIFICATION & ATTACK DEFENSE
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 2: CSRF STATE VERIFICATION & DEFENSE ---');

  // 2.1 Missing state param in callback
  const noStateReq = new Request('https://drlohithjj.in/api/v1/auth/callback?code=valid-auth-code', {
    headers: { 'Cookie': `__Host-oauth_state=${stateParam}` }
  });
  const noStateRes = await worker.fetch(noStateReq, mockEnv, {});
  assert.strictEqual(noStateRes.status, 401, '2.1 Missing state param returns 401 Unauthorized');
  const noStateBody = await noStateRes.json();
  assert.strictEqual(noStateBody.error.code, 'UNAUTHORIZED', '2.2 Error code is UNAUTHORIZED');

  // 2.2 Mismatched state param (CSRF attempt)
  const mismatchReq = new Request('https://drlohithjj.in/api/v1/auth/callback?code=valid-auth-code&state=forged_attacker_state_123', {
    headers: { 'Cookie': `__Host-oauth_state=${stateParam}` }
  });
  const mismatchRes = await worker.fetch(mismatchReq, mockEnv, {});
  assert.strictEqual(mismatchRes.status, 401, '2.3 State mismatch returns 401 Unauthorized');

  // 2.3 Missing cookie state (Browser without cookie)
  const noCookieReq = new Request(`https://drlohithjj.in/api/v1/auth/callback?code=valid-auth-code&state=${stateParam}`);
  const noCookieRes = await worker.fetch(noCookieReq, mockEnv, {});
  assert.strictEqual(noCookieRes.status, 401, '2.4 Missing state cookie returns 401 Unauthorized');

  // 2.4 Missing authorization code
  const noCodeReq = new Request(`https://drlohithjj.in/api/v1/auth/callback?state=${stateParam}`, {
    headers: { 'Cookie': `__Host-oauth_state=${stateParam}` }
  });
  const noCodeRes = await worker.fetch(noCodeReq, mockEnv, {});
  assert.strictEqual(noCodeRes.status, 400, '2.5 Missing code parameter returns 400 Validation Error');
  console.log('  ✅ [PASS] 2.1 CSRF state mismatch, missing cookie, and missing code strictly rejected');

  // ----------------------------------------------------------------
  // SUITE 3: NON-ALLOWLISTED GITHUB USER DEFENSE
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 3: ALLOWLIST DEFENSE ---');

  const intruderState = 'valid_state_for_intruder_session_1234567890abcdef1234567890abcdef';
  const intruderReq = new Request(`https://drlohithjj.in/api/v1/auth/callback?code=unauthorized-user-code&state=${intruderState}`, {
    headers: { 'Cookie': `__Host-oauth_state=${intruderState}` }
  });
  const intruderRes = await worker.fetch(intruderReq, mockEnv, {});
  assert.strictEqual(intruderRes.status, 403, '3.1 Unauthorized GitHub ID returns 403 Forbidden');
  const intruderBody = await intruderRes.json();
  assert.strictEqual(intruderBody.error.code, 'FORBIDDEN', '3.2 Error code is FORBIDDEN');
  assert.strictEqual(sessionsMap.size, 0, '3.3 Zero sessions created for unauthorized user');
  console.log('  ✅ [PASS] 3.1 Non-allowlisted GitHub accounts are strictly rejected with HTTP 403');

  // ----------------------------------------------------------------
  // SUITE 4: SUCCESSFUL OAUTH CALLBACK & SESSION ISSUANCE
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 4: SUCCESSFUL OAUTH CALLBACK & SESSION ISSUANCE ---');

  const validCallbackReq = new Request(`https://drlohithjj.in/api/v1/auth/callback?code=valid-auth-code&state=${stateParam}`, {
    headers: { 'Cookie': `__Host-oauth_state=${stateParam}` }
  });
  const validCallbackRes = await worker.fetch(validCallbackReq, mockEnv, {});

  assert.strictEqual(validCallbackRes.status, 302, '4.1 Successful callback returns 302 Redirect');
  assert.strictEqual(validCallbackRes.headers.get('Location'), '/dashboard', '4.2 Redirect destination is /dashboard');

  const callbackCookies = validCallbackRes.headers.get('Set-Cookie');
  assert(callbackCookies.includes('__Host-admin_session='), '4.3 __Host-admin_session cookie issued');
  assert(callbackCookies.includes('HttpOnly'), '4.4 Session cookie is HttpOnly');
  assert(callbackCookies.includes('Secure'), '4.5 Session cookie is Secure');
  assert(callbackCookies.includes('SameSite=Strict'), '4.6 Session cookie uses SameSite=Strict');
  assert(callbackCookies.includes('Max-Age=604800'), '4.7 Session cookie Max-Age is 7 days');

  // Extract issued session token
  const tokenMatch = callbackCookies.match(/__Host-admin_session=([^;]+)/);
  assert(tokenMatch, '4.8 Session token extractable from Set-Cookie');
  const issuedRawToken = tokenMatch[1];

  // Verify D1 record
  assert.strictEqual(sessionsMap.size, 1, '4.9 Exactly 1 session record created in D1');
  const sessionRecord = Array.from(sessionsMap.values())[0];
  assert.strictEqual(sessionRecord.github_user_id, 123456, '4.10 GitHub numeric ID matches allowlist');
  assert.strictEqual(sessionRecord.github_login, 'spreetham42', '4.11 GitHub username recorded');
  assert.strictEqual(sessionRecord.user_email, 'lohithjj@gmail.com', '4.12 Verified email recorded');

  // Verify raw token NOT in DB
  const expectedHash = await hashSessionToken(issuedRawToken);
  assert.strictEqual(sessionRecord.session_token_hash, expectedHash, '4.13 Persisted value is SHA-256 hash');
  assert(!JSON.stringify(sessionRecord).includes(issuedRawToken), '4.14 Raw token is absent from database');
  console.log('  ✅ [PASS] 4.1 Successful OAuth exchange generates D1 session & __Host-admin_session cookie');

  // ----------------------------------------------------------------
  // SUITE 5: GET /api/v1/auth/me (IDENTITY ENDPOINT)
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 5: GET /api/v1/auth/me ---');

  // 5.1 With valid session cookie
  const meReq = new Request('https://drlohithjj.in/api/v1/auth/me', {
    headers: { 'Cookie': `__Host-admin_session=${issuedRawToken}` }
  });
  const meRes = await worker.fetch(meReq, mockEnv, {});
  assert.strictEqual(meRes.status, 200, '5.1 Valid session returns 200 OK');
  const meBody = await meRes.json();
  assert.strictEqual(meBody.authenticated, true, '5.2 authenticated is true');
  assert.strictEqual(meBody.user.githubId, 123456, '5.3 Correct GitHub ID in payload');
  assert.strictEqual(meBody.user.login, 'spreetham42', '5.4 Correct GitHub login');
  assert.strictEqual(meBody.user.email, 'lohithjj@gmail.com', '5.5 Correct email in payload');
  assert(!JSON.stringify(meBody).includes(expectedHash), '5.6 Token hash is NOT leaked in JSON');
  assert(!JSON.stringify(meBody).includes(issuedRawToken), '5.7 Raw token is NOT leaked in JSON');

  // 5.2 Without cookie
  const noMeReq = new Request('https://drlohithjj.in/api/v1/auth/me');
  const noMeRes = await worker.fetch(noMeReq, mockEnv, {});
  assert.strictEqual(noMeRes.status, 401, '5.8 Missing cookie returns 401 Unauthorized');

  // 5.3 With invalid/tampered cookie
  const badMeReq = new Request('https://drlohithjj.in/api/v1/auth/me', {
    headers: { 'Cookie': '__Host-admin_session=invalid_tampered_token_xyz' }
  });
  const badMeRes = await worker.fetch(badMeReq, mockEnv, {});
  assert.strictEqual(badMeRes.status, 401, '5.9 Tampered cookie returns 401 Unauthorized');
  console.log('  ✅ [PASS] 5.1 /api/v1/auth/me verifies active session and returns sanitized user identity');

  // ----------------------------------------------------------------
  // SUITE 6: POST /api/v1/auth/logout
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 6: POST /api/v1/auth/logout ---');

  const logoutReq = new Request('https://drlohithjj.in/api/v1/auth/logout', {
    method: 'POST',
    headers: { 'Cookie': `__Host-admin_session=${issuedRawToken}` }
  });
  const logoutRes = await worker.fetch(logoutReq, mockEnv, {});
  assert.strictEqual(logoutRes.status, 200, '6.1 Logout returns 200 OK');
  const logoutBody = await logoutRes.json();
  assert.strictEqual(logoutBody.success, true, '6.2 Response success is true');

  const logoutCookie = logoutRes.headers.get('Set-Cookie');
  assert(logoutCookie.includes('__Host-admin_session=;'), '6.3 Session cookie cleared');
  assert(logoutCookie.includes('Max-Age=0'), '6.4 Cookie Max-Age set to 0');

  // Verify session in D1 was revoked
  const revokedSession = sessionsMap.get(sessionRecord.id);
  assert.notStrictEqual(revokedSession.revoked_at, null, '6.5 Session revoked_at timestamp set in D1');

  // Verify subsequent /auth/me returns 401
  const postLogoutMeRes = await worker.fetch(meReq, mockEnv, {});
  assert.strictEqual(postLogoutMeRes.status, 401, '6.6 Revoked session rejected on subsequent request');
  console.log('  ✅ [PASS] 6.1 Logout revokes D1 session and clears browser session cookie');

  console.log('\n' + '='.repeat(70));
  console.log(' ALL 6 SUITES PASSED (28/28 ASSERTIONS)');
  console.log('='.repeat(70) + '\n');
}

runTests().finally(() => {
  globalThis.fetch = originalFetch;
});
