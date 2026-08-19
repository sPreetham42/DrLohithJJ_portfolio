// ================================================================
// CENTRAL AUTH DISPATCHER TEST SUITE
// Tests feature-flagged dispatch between ACCESS (default) and SESSION modes,
// fail-closed safety, and CSRF protection for state-changing requests
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
console.log(' CENTRAL AUTH DISPATCHER & FEATURE-FLAG TEST SUITE');
console.log('='.repeat(70) + '\n');

// 1. Helper to construct mock JWT for Cloudflare Access tests
function createMockJwt(email, expSec = Math.floor(Date.now() / 1000) + 3600) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: 'user-access-12345',
    email,
    name: 'Dr. Lohith J.J.',
    exp: expSec
  })).toString('base64url');
  return `${header}.${payload}.mockSignature12345`;
}

// 2. In-Memory D1 Mock Store
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
            return { results: [] };
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
            return { success: true, meta: { changes: 1 } };
          }
        };
      }
    };
  }
};

const sessionRepo = new SessionRepository(mockDb);

async function runTests() {
  const validAccessJwt = createMockJwt('lohithjj@gmail.com');
  const intruderAccessJwt = createMockJwt('intruder@unknown.com');

  // Seed active session in D1
  const rawSessionToken = 'session_token_valid_dispatcher_test_12345';
  const tokenHash = await hashSessionToken(rawSessionToken);
  const futureExpiry = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

  await sessionRepo.createSession({
    id: 'sess-dispatcher-1',
    session_token_hash: tokenHash,
    github_user_id: 123456,
    github_login: 'spreetham42',
    user_email: 'lohithjj@gmail.com',
    user_name: 'Dr. Lohith J.J.',
    expires_at: futureExpiry
  });

  // ----------------------------------------------------------------
  // SUITE 1: AUTH_MODE = 'ACCESS' (DEFAULT PRODUCTION BEHAVIOR)
  // ----------------------------------------------------------------
  console.log('--- SUITE 1: AUTH_MODE = ACCESS (DEFAULT) ---');

  const accessEnv = {
    DB: mockDb,
    ENVIRONMENT: 'production',
    AUTH_MODE: 'ACCESS',
    ADMIN_EMAILS: 'lohithjj@gmail.com'
  };

  // 1.1 Valid Access JWT returns 200 OK
  const validAccessReq = new Request('https://drlohithjj.in/api/v1/admin/profile', {
    headers: { 'Cf-Access-Jwt-Assertion': validAccessJwt }
  });
  const validAccessRes = await worker.fetch(validAccessReq, accessEnv, {});
  assert.strictEqual(validAccessRes.status, 200, '1.1 ACCESS mode: Valid JWT assertion returns 200 OK');

  // 1.2 Missing Access JWT returns 401 Unauthorized
  const noAuthReq = new Request('https://drlohithjj.in/api/v1/admin/profile');
  const noAuthRes = await worker.fetch(noAuthReq, accessEnv, {});
  assert.strictEqual(noAuthRes.status, 401, '1.2 ACCESS mode: Missing JWT returns 401 Unauthorized');

  // 1.3 Session cookie ignored when in ACCESS mode (Requires JWT)
  const cookieOnlyReq = new Request('https://drlohithjj.in/api/v1/admin/profile', {
    headers: { 'Cookie': `__Host-admin_session=${rawSessionToken}` }
  });
  const cookieOnlyRes = await worker.fetch(cookieOnlyReq, accessEnv, {});
  assert.strictEqual(cookieOnlyRes.status, 401, '1.3 ACCESS mode: Session cookie without JWT is strictly rejected');

  // 1.4 Unlisted email rejected with 403 Forbidden
  const intruderReq = new Request('https://drlohithjj.in/api/v1/admin/profile', {
    headers: { 'Cf-Access-Jwt-Assertion': intruderAccessJwt }
  });
  const intruderRes = await worker.fetch(intruderReq, accessEnv, {});
  assert.strictEqual(intruderRes.status, 403, '1.4 ACCESS mode: Non-allowlisted email returns 403 Forbidden');
  console.log('  ✅ [PASS] 1.1 ACCESS mode strictly enforces Cloudflare Access JWT assertions');

  // ----------------------------------------------------------------
  // SUITE 2: AUTH_MODE = 'SESSION' (D1 SESSION MODE)
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 2: AUTH_MODE = SESSION ---');

  const sessionEnv = {
    DB: mockDb,
    ENVIRONMENT: 'production',
    AUTH_MODE: 'SESSION',
    ADMIN_GITHUB_USERS: '123456,spreetham42,lohithjj@gmail.com'
  };

  // 2.1 Valid session cookie returns 200 OK
  const validSessionReq = new Request('https://drlohithjj.in/api/v1/admin/profile', {
    headers: { 'Cookie': `__Host-admin_session=${rawSessionToken}` }
  });
  const validSessionRes = await worker.fetch(validSessionReq, sessionEnv, {});
  assert.strictEqual(validSessionRes.status, 200, '2.1 SESSION mode: Valid session cookie returns 200 OK');

  // 2.2 Missing session cookie returns 401 Unauthorized
  const noSessionReq = new Request('https://drlohithjj.in/api/v1/admin/profile');
  const noSessionRes = await worker.fetch(noSessionReq, sessionEnv, {});
  assert.strictEqual(noSessionRes.status, 401, '2.2 SESSION mode: Missing cookie returns 401 Unauthorized');

  // 2.3 Access JWT ignored when in SESSION mode (Requires valid D1 session)
  const jwtOnlyReq = new Request('https://drlohithjj.in/api/v1/admin/profile', {
    headers: { 'Cf-Access-Jwt-Assertion': validAccessJwt }
  });
  const jwtOnlyRes = await worker.fetch(jwtOnlyReq, sessionEnv, {});
  assert.strictEqual(jwtOnlyRes.status, 401, '2.3 SESSION mode: Access JWT without cookie is strictly rejected');

  // 2.4 CSRF Protection: Cross-site state-changing request rejected with 403
  const crossSiteReq = new Request('https://drlohithjj.in/api/v1/admin/profile', {
    method: 'PUT',
    headers: {
      'Cookie': `__Host-admin_session=${rawSessionToken}`,
      'Sec-Fetch-Site': 'cross-site',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ version: 1, name: 'Dr. Lohith J.J.' })
  });
  const crossSiteRes = await worker.fetch(crossSiteReq, sessionEnv, {});
  assert.strictEqual(crossSiteRes.status, 403, '2.4 SESSION mode: Cross-site mutation rejected with 403 Forbidden');
  console.log('  ✅ [PASS] 2.1 SESSION mode strictly enforces D1 session cookie & CSRF boundaries');

  // ----------------------------------------------------------------
  // SUITE 3: FAIL-CLOSED SAFETY
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 3: FAIL-CLOSED SAFETY ---');

  // 3.1 AUTH_MODE undefined -> defaults to ACCESS
  const undefinedEnv = {
    DB: mockDb,
    ENVIRONMENT: 'production'
    // AUTH_MODE not defined
  };
  const unconfiguredRes = await worker.fetch(noAuthReq, undefinedEnv, {});
  assert.strictEqual(unconfiguredRes.status, 401, '3.1 Undefined AUTH_MODE fails closed to ACCESS');

  // 3.2 AUTH_MODE invalid string -> defaults to ACCESS
  const invalidEnv = {
    DB: mockDb,
    ENVIRONMENT: 'production',
    AUTH_MODE: 'INVALID_AUTH_METHOD_XYZ'
  };
  const invalidRes = await worker.fetch(noAuthReq, invalidEnv, {});
  assert.strictEqual(invalidRes.status, 401, '3.2 Invalid AUTH_MODE fails closed to ACCESS');

  // 3.3 Valid Access JWT still succeeds when AUTH_MODE is undefined (default)
  const defaultAccessRes = await worker.fetch(validAccessReq, undefinedEnv, {});
  assert.strictEqual(defaultAccessRes.status, 200, '3.3 Valid Access JWT succeeds under default unconfigured environment');
  console.log('  ✅ [PASS] 3.1 Unset or invalid AUTH_MODE safely fails closed to ACCESS');

  console.log('\n' + '='.repeat(70));
  console.log(' ALL 3 SUITES PASSED (11/11 ASSERTIONS)');
  console.log('='.repeat(70) + '\n');
}

runTests();
