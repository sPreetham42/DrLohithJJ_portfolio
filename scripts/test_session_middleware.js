// ================================================================
// D1 ADMIN SESSION MIDDLEWARE TEST SUITE
// Tests cookie extraction, SHA-256 validation, identity mapping, anti-spoofing & revocation
// ================================================================

import assert from 'assert';
import { authenticateAdminSession, extractSessionToken } from '../worker/middleware/session.js';
import { SessionRepository, hashSessionToken } from '../worker/repositories/session.repository.js';
import { UnauthorizedError } from '../worker/errors.js';

console.log('='.repeat(70));
console.log(' D1 ADMIN SESSION MIDDLEWARE TEST SUITE');
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
            if (q.includes('SET revoked_at = ?') && q.includes('WHERE id = ?')) {
              const [revokedAt, id] = params;
              const s = sessionsMap.get(id);
              if (s && s.revoked_at === null) {
                s.revoked_at = revokedAt;
                return { success: true, meta: { changes: 1 } };
              }
              return { success: true, meta: { changes: 0 } };
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
  ENVIRONMENT: 'production'
};

const sessionRepo = new SessionRepository(mockDb);

async function runTests() {
  // ----------------------------------------------------------------
  // SUITE 1: COOKIE EXTRACTION & MULTI-COOKIE PARSING
  // ----------------------------------------------------------------
  console.log('--- SUITE 1: COOKIE EXTRACTION & PARSING ---');

  const testToken = 'raw_opaque_session_token_11111111111111111111111111111111';

  // 1.1 Single cookie
  const req1 = new Request('https://drlohithjj.in/api/v1/admin/profile', {
    headers: { 'Cookie': `__Host-admin_session=${testToken}` }
  });
  assert.strictEqual(extractSessionToken(req1), testToken, '1.1 Extracts single __Host-admin_session cookie');

  // 1.2 Multiple cookies
  const req2 = new Request('https://drlohithjj.in/api/v1/admin/profile', {
    headers: { 'Cookie': `theme=dark; __Host-admin_session=${testToken}; analytics_id=abc; session_id=999` }
  });
  assert.strictEqual(extractSessionToken(req2), testToken, '1.2 Correctly extracts from multi-cookie header');

  // 1.3 Missing cookie
  const req3 = new Request('https://drlohithjj.in/api/v1/admin/profile', {
    headers: { 'Cookie': 'theme=dark; other_cookie=123' }
  });
  assert.strictEqual(extractSessionToken(req3), null, '1.3 Returns null when session cookie absent');

  // 1.4 No cookie header
  const req4 = new Request('https://drlohithjj.in/api/v1/admin/profile');
  assert.strictEqual(extractSessionToken(req4), null, '1.4 Returns null when Cookie header missing');

  // 1.5 Local development fallback cookie (portfolio_admin_session)
  const req5 = new Request('http://localhost/api/v1/admin/profile', {
    headers: { 'Cookie': `portfolio_admin_session=${testToken}` }
  });
  assert.strictEqual(extractSessionToken(req5), testToken, '1.5 Falls back to portfolio_admin_session for local dev');
  console.log('  ✅ [PASS] 1.1 Cookie extraction reliably parses single, multi, and fallback cookies');

  // ----------------------------------------------------------------
  // SUITE 2: D1 SESSION AUTHENTICATION & IDENTITY MAPPING
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 2: D1 SESSION AUTHENTICATION & IDENTITY MAPPING ---');

  const rawTokenA = 'valid_raw_admin_session_token_aaaaabbbbbccccc';
  const tokenHashA = await hashSessionToken(rawTokenA);
  const now = new Date();
  const futureExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const initialTime = now.toISOString();

  // Create active session in mock D1
  await sessionRepo.createSession({
    id: 'sess-test-valid-1',
    session_token_hash: tokenHashA,
    github_user_id: 12345678,
    github_login: 'drlohith',
    user_email: 'lohithjj@gmail.com',
    user_name: 'Dr. Lohith J.J.',
    user_avatar: 'https://avatars.githubusercontent.com/u/12345678',
    expires_at: futureExpiry,
    created_at: initialTime,
    last_used_at: initialTime
  });

  const authReq = new Request('https://drlohithjj.in/api/v1/admin/profile', {
    headers: { 'Cookie': `__Host-admin_session=${rawTokenA}` }
  });

  const user = await authenticateAdminSession(authReq, mockEnv);

  assert.strictEqual(user.email, 'lohithjj@gmail.com', '2.1 user.email mapped correctly for downstream handlers');
  assert.strictEqual(user.sub, '12345678', '2.2 user.sub matches numeric GitHub ID string');
  assert.strictEqual(user.name, 'Dr. Lohith J.J.', '2.3 user.name matches GitHub display name');
  assert.strictEqual(user.githubId, 12345678, '2.4 user.githubId preserved');
  assert.strictEqual(user.login, 'drlohith', '2.5 user.login preserved');
  assert.strictEqual(user.avatarUrl, 'https://avatars.githubusercontent.com/u/12345678', '2.6 user.avatarUrl preserved');
  assert(!JSON.stringify(user).includes(rawTokenA), '2.7 Raw token is NEVER present in AuthenticatedUser object');
  console.log('  ✅ [PASS] 2.1 Valid active session successfully resolves to AuthenticatedUser');

  // ----------------------------------------------------------------
  // SUITE 3: EXPIRY & REVOCATION ENFORCEMENT
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 3: EXPIRY & REVOCATION ENFORCEMENT ---');

  // 3.1 Expired session
  const rawExpiredToken = 'expired_raw_session_token_9999999999999999';
  const expiredHash = await hashSessionToken(rawExpiredToken);
  const pastExpiry = new Date(Date.now() - 3600 * 1000).toISOString();

  await sessionRepo.createSession({
    id: 'sess-test-expired',
    session_token_hash: expiredHash,
    github_user_id: 888888,
    github_login: 'expired_admin',
    user_email: 'expired@example.com',
    expires_at: pastExpiry
  });

  const expiredReq = new Request('https://drlohithjj.in/api/v1/admin/profile', {
    headers: { 'Cookie': `__Host-admin_session=${rawExpiredToken}` }
  });

  await assert.rejects(
    async () => await authenticateAdminSession(expiredReq, mockEnv),
    (err) => {
      assert(err instanceof UnauthorizedError, '3.1 Error is UnauthorizedError');
      assert.strictEqual(err.status, 401, '3.2 Status is 401');
      return true;
    },
    '3.3 Expired session is strictly rejected with 401'
  );
  console.log('  ✅ [PASS] 3.1 Expired session rejected with UnauthorizedError (401)');

  // 3.2 Revoked session
  const rawRevokedToken = 'revoked_raw_session_token_8888888888888888';
  const revokedHash = await hashSessionToken(rawRevokedToken);

  await sessionRepo.createSession({
    id: 'sess-test-revoked',
    session_token_hash: revokedHash,
    github_user_id: 777777,
    github_login: 'revoked_admin',
    user_email: 'revoked@example.com',
    expires_at: futureExpiry
  });

  // Explicitly revoke
  await sessionRepo.revokeSession('sess-test-revoked');

  const revokedReq = new Request('https://drlohithjj.in/api/v1/admin/profile', {
    headers: { 'Cookie': `__Host-admin_session=${rawRevokedToken}` }
  });

  await assert.rejects(
    async () => await authenticateAdminSession(revokedReq, mockEnv),
    (err) => {
      assert(err instanceof UnauthorizedError, '3.4 Error is UnauthorizedError');
      assert.strictEqual(err.status, 401, '3.5 Status is 401');
      return true;
    },
    '3.6 Revoked session is strictly rejected with 401'
  );
  console.log('  ✅ [PASS] 3.2 Revoked session rejected with UnauthorizedError (401)');

  // 3.3 Unknown / forged token
  const forgedReq = new Request('https://drlohithjj.in/api/v1/admin/profile', {
    headers: { 'Cookie': '__Host-admin_session=forged_unregistered_token_000000' }
  });

  await assert.rejects(
    async () => await authenticateAdminSession(forgedReq, mockEnv),
    (err) => err instanceof UnauthorizedError && err.status === 401,
    '3.7 Forged token rejected with 401'
  );
  console.log('  ✅ [PASS] 3.3 Forged / unrecorded token rejected with 401');

  // ----------------------------------------------------------------
  // SUITE 4: ANTI-SPOOFING & SECURITY BOUNDARY
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 4: ANTI-SPOOFING & SECURITY BOUNDARY ---');

  // Attacker attempts to spoof identity using headers and query params
  const spoofReq = new Request('https://drlohithjj.in/api/v1/admin/profile?email=intruder@attacker.com&sub=999999', {
    headers: {
      'Cookie': `__Host-admin_session=${rawTokenA}`,
      'X-Forwarded-Email': 'intruder@attacker.com',
      'X-Forwarded-User': 'intruder',
      'Cf-Access-Jwt-Assertion': 'fake.access.jwt',
      'X-Admin-Role': 'superadmin'
    }
  });

  const spoofUser = await authenticateAdminSession(spoofReq, mockEnv);

  assert.strictEqual(spoofUser.email, 'lohithjj@gmail.com', '4.1 Spoofed headers ignored; email sourced strictly from D1');
  assert.strictEqual(spoofUser.sub, '12345678', '4.2 Spoofed query params ignored; sub sourced strictly from D1');
  assert.strictEqual(spoofUser.login, 'drlohith', '4.3 Login identity sourced strictly from D1');
  console.log('  ✅ [PASS] 4.1 Client headers and query parameters cannot spoof session identity');

  // ----------------------------------------------------------------
  // SUITE 5: LAST-USED TIMESTAMP UPDATE
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 5: LAST-USED TIMESTAMP UPDATE ---');

  const beforeAuthTime = new Date().toISOString();
  await authenticateAdminSession(authReq, mockEnv);

  const updatedSession = sessionsMap.get('sess-test-valid-1');
  assert(updatedSession.last_used_at >= beforeAuthTime, '5.1 last_used_at updated on successful authentication');
  assert.strictEqual(updatedSession.created_at, initialTime, '5.2 created_at remains unchanged');
  assert.strictEqual(updatedSession.github_user_id, 12345678, '5.3 Unrelated columns untouched');
  console.log('  ✅ [PASS] 5.1 Successful authentication updates session last_used_at timestamp');

  console.log('\n' + '='.repeat(70));
  console.log(' ALL 5 SUITES PASSED (18/18 ASSERTIONS)');
  console.log('='.repeat(70) + '\n');
}

runTests();
