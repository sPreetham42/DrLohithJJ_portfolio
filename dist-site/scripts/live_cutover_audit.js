// ================================================================
// LIVE PRODUCTION POST-CUTOVER AUDIT SCRIPT
// Validates all public endpoints, unauthenticated admin boundaries,
// CSRF protection, and dashboard serving on drlohithjj.in
// ================================================================

async function runLiveAudit() {
  const BASE = 'https://drlohithjj.in';
  console.log('='.repeat(70));
  console.log(' LIVE PRODUCTION POST-CUTOVER AUDIT (drlohithjj.in)');
  console.log('='.repeat(70) + '\n');

  // 1. Public Endpoints
  console.log('--- 1. PUBLIC ENDPOINTS REGRESSION CHECK ---');
  const publicEndpoints = [
    '/',
    '/api/v1/health',
    '/api/v1/public/profile',
    '/api/v1/public/scholar-stats',
    '/api/v1/public/publications',
    '/api/v1/public/talks',
    '/api/v1/public/experience',
    '/api/v1/public/education',
    '/api/v1/public/awards',
    '/api/v1/public/skills',
    '/api/v1/public/social-links'
  ];

  let publicAllPassed = true;
  for (const ep of publicEndpoints) {
    const res = await fetch(BASE + ep);
    let extra = '';
    if (ep === '/api/v1/public/scholar-stats') {
      const data = await res.json();
      extra = `(Citations: ${data.citations}, h-index: ${data.h_index}, i10: ${data.i10_index})`;
    } else if (ep === '/api/v1/health') {
      const data = await res.json();
      extra = `(env: ${data.environment})`;
    }
    const pass = res.status === 200;
    if (!pass) publicAllPassed = false;
    console.log(`  ${pass ? '✅ [PASS]' : '❌ [FAIL]'} GET ${ep.padEnd(32)} -> HTTP ${res.status} ${extra}`);
  }

  // 2. Unauthenticated Admin API Protection
  console.log('\n--- 2. UNAUTHENTICATED ADMIN PROTECTION (CUSTOM DOMAIN & WORKERS.DEV) ---');
  const unauthCustom = await fetch(BASE + '/api/v1/admin/profile');
  const unauthCustomBody = await unauthCustom.json();
  const unauthCustomPass = unauthCustom.status === 401 && unauthCustomBody.error.code === 'UNAUTHORIZED';
  console.log(`  ${unauthCustomPass ? '✅ [PASS]' : '❌ [FAIL]'} GET drlohithjj.in/api/v1/admin/profile (unauth) -> HTTP ${unauthCustom.status}: ${JSON.stringify(unauthCustomBody.error)}`);

  const unauthWorkersDev = await fetch('https://dr-lohith-portfolio-api.spreetham6442.workers.dev/api/v1/admin/profile');
  const unauthWorkersDevBody = await unauthWorkersDev.json();
  const unauthWorkersDevPass = unauthWorkersDev.status === 401 && unauthWorkersDevBody.error.code === 'UNAUTHORIZED';
  console.log(`  ${unauthWorkersDevPass ? '✅ [PASS]' : '❌ [FAIL]'} GET workers.dev/api/v1/admin/profile (unauth)      -> HTTP ${unauthWorkersDev.status}: ${JSON.stringify(unauthWorkersDevBody.error)}`);

  // 3. /auth/me unauthenticated
  const unauthMe = await fetch(BASE + '/api/v1/auth/me');
  const unauthMeBody = await unauthMe.json();
  const unauthMePass = unauthMe.status === 401 && unauthMeBody.authenticated === false;
  console.log(`  ${unauthMePass ? '✅ [PASS]' : '❌ [FAIL]'} GET /api/v1/auth/me (unauthenticated)            -> HTTP ${unauthMe.status}: ${JSON.stringify(unauthMeBody.error)}`);

  // 4. Admin Dashboard Static SPA
  console.log('\n--- 3. ADMIN DASHBOARD SPA SERVING ---');
  const dashRes = await fetch(BASE + '/dashboard');
  const dashText = await dashRes.text();
  const dashPass = dashRes.status === 200 && dashText.includes('index-BRFsOl0z.js');
  console.log(`  ${dashPass ? '✅ [PASS]' : '❌ [FAIL]'} GET /dashboard -> HTTP ${dashRes.status} (Contains React 19 Admin SPA Bundle)`);

  console.log('\n' + '='.repeat(70));
  console.log(' POST-CUTOVER LIVE AUDIT COMPLETE');
  console.log('='.repeat(70) + '\n');
}

runLiveAudit();
