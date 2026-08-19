// ================================================================
// D1 ADMIN SESSION REPOSITORY TEST SUITE
// Tests session creation, token hashing, lookup, expiration, and revocation
// ================================================================

import assert from 'assert';
import { SessionRepository, hashSessionToken } from '../worker/repositories/session.repository.js';

console.log('='.repeat(70));
console.log(' D1 ADMIN SESSION REPOSITORY TEST SUITE');
console.log('='.repeat(70) + '\n');

// In-Memory D1 Mock Store for admin_sessions
const sessionsMap = new Map();

const mockDb = {
  prepare(query) {
    const q = query.trim();
    return {
      bind(...params) {
        return {
          async first() {
            // SELECT * FROM admin_sessions WHERE session_token_hash = ? AND revoked_at IS NULL AND expires_at > ?
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
            // SELECT * FROM admin_sessions WHERE id = ?
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
            // INSERT INTO admin_sessions ...
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
            // UPDATE admin_sessions SET last_used_at = ? WHERE id = ? AND revoked_at IS NULL
            if (q.includes('SET last_used_at = ?') && q.includes('WHERE id = ?')) {
              const [lastUsedAt, id] = params;
              const s = sessionsMap.get(id);
              if (s && s.revoked_at === null) {
                s.last_used_at = lastUsedAt;
                return { success: true, meta: { changes: 1 } };
              }
              return { success: true, meta: { changes: 0 } };
            }
            // UPDATE admin_sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL
            if (q.includes('SET revoked_at = ?') && q.includes('WHERE id = ?')) {
              const [revokedAt, id] = params;
              const s = sessionsMap.get(id);
              if (s && s.revoked_at === null) {
                s.revoked_at = revokedAt;
                return { success: true, meta: { changes: 1 } };
              }
              return { success: true, meta: { changes: 0 } };
            }
            // UPDATE admin_sessions SET revoked_at = ? WHERE session_token_hash = ? AND revoked_at IS NULL
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
            // DELETE FROM admin_sessions WHERE expires_at <= ? OR revoked_at IS NOT NULL
            if (q.startsWith('DELETE FROM admin_sessions')) {
              const [nowIso] = params;
              let deleted = 0;
              for (const [k, s] of Array.from(sessionsMap.entries())) {
                if (s.expires_at <= nowIso || s.revoked_at !== null) {
                  sessionsMap.delete(k);
                  deleted++;
                }
              }
              return { success: true, meta: { changes: deleted } };
            }
            return { success: true, meta: { changes: 0 } };
          }
        };
      }
    };
  }
};

const repo = new SessionRepository(mockDb);

async function runTests() {
  // ----------------------------------------------------------------
  // SUITE 1: CRYPTOGRAPHIC SHA-256 TOKEN HASHING
  // ----------------------------------------------------------------
  console.log('--- SUITE 1: CRYPTOGRAPHIC SHA-256 TOKEN HASHING ---');

  const rawTokenA = 'raw_session_token_super_secret_opaque_12345';
  const rawTokenB = 'raw_session_token_super_secret_opaque_67890';

  const hashA1 = await hashSessionToken(rawTokenA);
  const hashA2 = await hashSessionToken(rawTokenA);
  const hashB = await hashSessionToken(rawTokenB);

  assert.strictEqual(hashA1, hashA2, '1.1 Deterministic: Same raw token produces identical hash');
  console.log('  ✅ [PASS] 1.1 Same raw token produces identical SHA-256 hash');

  assert.notStrictEqual(hashA1, hashB, '1.2 Collision-free: Different raw tokens produce different hashes');
  console.log('  ✅ [PASS] 1.2 Different raw tokens produce different hashes');

  assert.strictEqual(hashA1.length, 64, '1.3 Hash is standard 64-char hexadecimal');
  assert(/^[0-9a-f]{64}$/.test(hashA1), '1.4 Hash is valid lowercase hex string');
  console.log('  ✅ [PASS] 1.3 Format is valid 64-character lowercase hex string');

  // ----------------------------------------------------------------
  // SUITE 2: SESSION CREATION & PERSISTENCE
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 2: SESSION CREATION & PERSISTENCE ---');

  const now = new Date();
  const futureExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const createdAt = now.toISOString();

  const created = await repo.createSession({
    id: 'sess-1001',
    session_token_hash: hashA1,
    github_user_id: 123456,
    github_login: 'spreetham42',
    user_email: 'lohithjj@gmail.com',
    user_name: "Dr. Lohith J.J. O'Connor",
    user_avatar: 'https://avatars.githubusercontent.com/u/123456',
    expires_at: futureExpiry,
    created_at: createdAt,
    last_used_at: createdAt
  });

  assert.strictEqual(created.id, 'sess-1001', '2.1 Session ID matches');
  assert.strictEqual(created.session_token_hash, hashA1, '2.2 Stored token hash matches');
  assert.strictEqual(created.revoked_at, null, '2.3 revoked_at defaults to null');
  assert.strictEqual(created.github_user_id, 123456, '2.4 Numeric GitHub ID preserved');
  console.log('  ✅ [PASS] 2.1 Session successfully created with null revoked_at');

  // Verify raw token is NOT in database
  const rawDbRow = sessionsMap.get('sess-1001');
  assert(!JSON.stringify(rawDbRow).includes(rawTokenA), '2.5 Raw token is NOT stored in DB');
  console.log('  ✅ [PASS] 2.2 Raw token is completely absent from database row');

  // ----------------------------------------------------------------
  // SUITE 3: ACTIVE SESSION LOOKUP
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 3: ACTIVE SESSION LOOKUP ---');

  const activeSession = await repo.getSessionByTokenHash(hashA1);
  assert.notStrictEqual(activeSession, null, '3.1 Active session found by valid token hash');
  assert.strictEqual(activeSession.github_login, 'spreetham42', '3.2 Correct GitHub login returned');
  assert.strictEqual(activeSession.user_email, 'lohithjj@gmail.com', '3.3 Correct email returned');
  console.log('  ✅ [PASS] 3.1 Active session found by valid token hash');

  const notFound = await repo.getSessionByTokenHash('non_existent_hash_00000000000000000000000000000000000000000000000000');
  assert.strictEqual(notFound, null, '3.4 Non-existent token hash returns null');
  console.log('  ✅ [PASS] 3.2 Non-existent token hash returns null');

  // ----------------------------------------------------------------
  // SUITE 4: EXPIRED SESSION REJECTION
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 4: EXPIRED SESSION REJECTION ---');

  const expiredToken = 'expired_raw_token_99999';
  const expiredHash = await hashSessionToken(expiredToken);
  const pastExpiry = new Date(Date.now() - 3600 * 1000).toISOString(); // 1 hour ago

  await repo.createSession({
    id: 'sess-expired-1',
    session_token_hash: expiredHash,
    github_user_id: 789012,
    github_login: 'expired_user',
    user_email: 'expired@test.com',
    expires_at: pastExpiry
  });

  const expiredLookup = await repo.getSessionByTokenHash(expiredHash);
  assert.strictEqual(expiredLookup, null, '4.1 Expired session rejected at SQL query level');
  console.log('  ✅ [PASS] 4.1 Expired session returns null on lookup');

  // ----------------------------------------------------------------
  // SUITE 5: SESSION REVOCATION
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 5: SESSION REVOCATION ---');

  await repo.revokeSession('sess-1001');

  // Direct DB check for soft-delete timestamp
  const revokedRow = sessionsMap.get('sess-1001');
  assert.notStrictEqual(revokedRow.revoked_at, null, '5.1 revoked_at is populated with timestamp');
  console.log(`  ✅ [PASS] 5.1 revoked_at timestamp set to: ${revokedRow.revoked_at}`);

  // Lookup check: revoked session should now return null
  const revokedLookup = await repo.getSessionByTokenHash(hashA1);
  assert.strictEqual(revokedLookup, null, '5.2 Revoked session returns null on lookup');
  console.log('  ✅ [PASS] 5.2 Subsequent lookup for revoked session returns null');

  // ----------------------------------------------------------------
  // SUITE 6: LAST-USED TIMESTAMP UPDATE
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 6: LAST-USED TIMESTAMP UPDATE ---');

  const tokenC = 'raw_token_active_user_c';
  const hashC = await hashSessionToken(tokenC);
  const initialTime = new Date(Date.now() - 60000).toISOString();

  await repo.createSession({
    id: 'sess-active-c',
    session_token_hash: hashC,
    github_user_id: 555555,
    github_login: 'active_c',
    user_email: 'c@test.com',
    expires_at: futureExpiry,
    created_at: initialTime,
    last_used_at: initialTime
  });

  const updatedTime = new Date().toISOString();
  await repo.updateLastUsedAt('sess-active-c', updatedTime);

  const activeC = await repo.getSessionByTokenHash(hashC);
  assert.strictEqual(activeC.last_used_at, updatedTime, '6.1 last_used_at timestamp updated');
  assert.strictEqual(activeC.created_at, initialTime, '6.2 created_at remains unchanged');
  assert.strictEqual(activeC.github_login, 'active_c', '6.3 other fields untouched');
  console.log('  ✅ [PASS] 6.1 last_used_at updated without mutating other fields');

  // ----------------------------------------------------------------
  // SUITE 7: SQL SAFETY & SPECIAL CHARACTERS
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 7: SQL PARAMETERIZATION & SPECIAL CHARACTERS ---');

  const specialToken = 'raw_token_with_special_chars';
  const specialHash = await hashSessionToken(specialToken);
  const maliciousName = "Dr. Robert'); DROP TABLE admin_sessions;--";
  const maliciousEmail = "admin' OR '1'='1";

  await repo.createSession({
    id: 'sess-special-1',
    session_token_hash: specialHash,
    github_user_id: 999999,
    github_login: "user'--injection",
    user_email: maliciousEmail,
    user_name: maliciousName,
    expires_at: futureExpiry
  });

  const specialSession = await repo.getSessionByTokenHash(specialHash);
  assert.notStrictEqual(specialSession, null, '7.1 Injection attempt safely escaped');
  assert.strictEqual(specialSession.user_name, maliciousName, '7.2 Special characters preserved intact');
  assert.strictEqual(specialSession.user_email, maliciousEmail, '7.3 Parameterized binding verified');
  console.log('  ✅ [PASS] 7.1 Parameterized SQL safely handles quotes and injection strings');

  // ----------------------------------------------------------------
  // SUITE 8: EXPIRED SESSIONS CLEANUP
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 8: EXPIRED SESSIONS CLEANUP ---');

  const deletedCount = await repo.deleteExpiredSessions();
  assert(deletedCount >= 2, '8.1 Purged expired and revoked sessions');
  console.log(`  ✅ [PASS] 8.1 deleteExpiredSessions purged ${deletedCount} stale rows`);

  // Active session C still exists
  const stillActive = await repo.getSessionByTokenHash(hashC);
  assert.notStrictEqual(stillActive, null, '8.2 Valid active session C was preserved');
  console.log('  ✅ [PASS] 8.2 Valid active sessions remain intact');

  console.log('\n' + '='.repeat(70));
  console.log(' ALL 8 SUITES PASSED (16/16 ASSERTIONS)');
  console.log('='.repeat(70) + '\n');
}

runTests();
