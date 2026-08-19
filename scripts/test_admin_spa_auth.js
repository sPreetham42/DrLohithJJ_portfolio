// ================================================================
// PHASE 7 — ADMIN SPA AUTHENTICATION & CLIENT INTEGRATION TEST SUITE
// Tests /auth/me integration, logout action, 401 expiry listener, 409 error isolation,
// CSRF X-Admin-Request header injection, and client identity mapping
// ================================================================

import assert from 'assert';
import { adminApi, authApi, onAuthExpired, ApiClientError } from '../admin/src/api/client.js';

console.log('='.repeat(70));
console.log(' PHASE 7 — ADMIN SPA AUTH & CLIENT INTEGRATION TEST SUITE');
console.log('='.repeat(70) + '\n');

// Mock Global Fetch
const originalFetch = globalThis.fetch;
let mockFetchCalls = [];
let mockFetchResponseQueue = [];

function mockFetch(url, options = {}) {
  const call = { url: String(url), options };
  mockFetchCalls.push(call);

  if (mockFetchResponseQueue.length > 0) {
    const nextRes = mockFetchResponseQueue.shift();
    return Promise.resolve(nextRes(url, options));
  }

  return Promise.resolve(new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } }));
}

globalThis.fetch = mockFetch;

async function runSpaAuthTests() {
  // ----------------------------------------------------------------
  // SUITE 1: /auth/me INTEGRATION & IDENTITY RESOLUTION
  // ----------------------------------------------------------------
  console.log('--- SUITE 1: /api/v1/auth/me INTEGRATION ---');
  mockFetchCalls = [];
  mockFetchResponseQueue = [
    (url, opts) => {
      return new Response(JSON.stringify({
        authenticated: true,
        user: {
          githubId: 175527963,
          login: 'sPreetham42',
          email: 'spreetham6442@gmail.com',
          name: 'Preetham S',
          avatarUrl: 'https://avatars.githubusercontent.com/u/175527963'
        }
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  ];

  const meData = await authApi.getMe();
  assert.strictEqual(mockFetchCalls.length, 1, '1.1 authApi.getMe made 1 fetch call');
  assert(mockFetchCalls[0].url.endsWith('/api/v1/auth/me'), '1.2 Request path is /api/v1/auth/me');
  assert.strictEqual(mockFetchCalls[0].options.credentials, 'include', '1.3 credentials: include sent');
  assert.strictEqual(meData.authenticated, true, '1.4 authenticated is true');
  assert.strictEqual(meData.user.githubId, 175527963, '1.5 Dynamic numeric GitHub user ID returned');
  assert.strictEqual(meData.user.login, 'sPreetham42', '1.6 Dynamic GitHub login handle returned');
  console.log('  ✅ [PASS] 1.1 /api/v1/auth/me correctly resolves dynamic user identity');

  // ----------------------------------------------------------------
  // SUITE 2: POST /api/v1/auth/logout ACTION
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 2: POST /api/v1/auth/logout ---');
  mockFetchCalls = [];
  mockFetchResponseQueue = [
    (url, opts) => {
      return new Response(JSON.stringify({
        success: true,
        message: 'Admin session successfully revoked'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  ];

  const logoutRes = await authApi.logout();
  assert.strictEqual(mockFetchCalls.length, 1, '2.1 authApi.logout made 1 fetch call');
  assert(mockFetchCalls[0].url.endsWith('/api/v1/auth/logout'), '2.2 Request path is /api/v1/auth/logout');
  assert.strictEqual(mockFetchCalls[0].options.method, 'POST', '2.3 Request method is POST');
  assert.strictEqual(mockFetchCalls[0].options.credentials, 'include', '2.4 credentials: include sent');
  assert.strictEqual(mockFetchCalls[0].options.headers.get('X-Admin-Request'), '1', '2.5 CSRF header X-Admin-Request: 1 injected');
  assert.strictEqual(logoutRes.success, true, '2.6 Logout response success is true');
  console.log('  ✅ [PASS] 2.1 authApi.logout dispatches POST with CSRF header and credentials');

  // ----------------------------------------------------------------
  // SUITE 3: 401 AUTH EXPIRATION NOTIFICATION
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 3: 401 EXPIRATION NOTIFICATION ---');
  let authExpiredCount = 0;
  const unsubscribe = onAuthExpired(() => {
    authExpiredCount++;
  });

  mockFetchCalls = [];
  mockFetchResponseQueue = [
    (url, opts) => {
      return new Response(JSON.stringify({
        error: { code: 'UNAUTHORIZED', message: 'Admin session expired' }
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
  ];

  try {
    await adminApi.getProfile();
    assert.fail('Should have thrown ApiClientError on 401');
  } catch (err) {
    assert(err instanceof ApiClientError, '3.1 Throws ApiClientError');
    assert.strictEqual(err.status, 401, '3.2 Error status is 401');
  }

  assert.strictEqual(authExpiredCount, 1, '3.3 onAuthExpired listener triggered on 401');
  unsubscribe();
  console.log('  ✅ [PASS] 3.1 401 Unauthorized safely notifies SPA to transition to login');

  // ----------------------------------------------------------------
  // SUITE 4: 409 CONFLICT DOES NOT TRIGGER LOGOUT
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 4: 409 CONFLICT ISOLATION ---');
  let non401ExpiredCount = 0;
  const unsub409 = onAuthExpired(() => {
    non401ExpiredCount++;
  });

  mockFetchCalls = [];
  mockFetchResponseQueue = [
    (url, opts) => {
      return new Response(JSON.stringify({
        error: { code: 'VERSION_CONFLICT', message: 'Record was modified by another session' }
      }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }
  ];

  try {
    await adminApi.updateProfile({ name: 'Dr. Lohith J.J.' }, 1);
    assert.fail('Should have thrown ApiClientError on 409');
  } catch (err) {
    assert(err instanceof ApiClientError, '4.1 Throws ApiClientError on 409');
    assert.strictEqual(err.status, 409, '4.2 Error status is 409');
    assert.strictEqual(err.code, 'VERSION_CONFLICT', '4.3 Concurrency error code preserved');
  }

  assert.strictEqual(non401ExpiredCount, 0, '4.4 409 Conflict DOES NOT trigger onAuthExpired');
  unsub409();
  console.log('  ✅ [PASS] 4.1 409 Conflict preserved as business error without triggering logout');

  // ----------------------------------------------------------------
  // SUITE 5: CSRF X-ADMIN-REQUEST HEADER ON MUTATIONS
  // ----------------------------------------------------------------
  console.log('\n--- SUITE 5: CSRF HEADER ON STATE-CHANGING CALLS ---');
  mockFetchCalls = [];
  mockFetchResponseQueue = [
    () => new Response(JSON.stringify({ id: 'pub-1' }), { status: 200 }),
    () => new Response(JSON.stringify({ id: 'pub-1' }), { status: 200 }),
    () => new Response(JSON.stringify({ success: true }), { status: 200 }),
    () => new Response(JSON.stringify({ id: 'pub-1' }), { status: 200 })
  ];

  await adminApi.createPublication({ title: 'Paper 1' });
  await adminApi.updatePublication('pub-1', { title: 'Paper 1 Updated' }, 1);
  await adminApi.deletePublication('pub-1', 1);
  await adminApi.getPublicationById('pub-1'); // GET request

  assert.strictEqual(mockFetchCalls[0].options.headers.get('X-Admin-Request'), '1', '5.1 POST includes X-Admin-Request');
  assert.strictEqual(mockFetchCalls[1].options.headers.get('X-Admin-Request'), '1', '5.2 PUT includes X-Admin-Request');
  assert.strictEqual(mockFetchCalls[2].options.headers.get('X-Admin-Request'), '1', '5.3 DELETE includes X-Admin-Request');
  assert.strictEqual(mockFetchCalls[3].options.headers.get('X-Admin-Request'), null, '5.4 GET does not send X-Admin-Request');
  console.log('  ✅ [PASS] 5.1 CSRF header X-Admin-Request strictly injected on mutations only');

  console.log('\n' + '='.repeat(70));
  console.log(' ALL 5 SUITES PASSED (18/18 ASSERTIONS)');
  console.log('='.repeat(70) + '\n');
}

runSpaAuthTests().finally(() => {
  globalThis.fetch = originalFetch;
});
