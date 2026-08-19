// ================================================================
// UNIFIED CLOUDFLARE ROUTING TEST SUITE
// Automated verification of unified routing for / (public),
// /dashboard/* (Admin SPA fallback), /api/v1/* (Worker APIs),
// and static asset isolation
// ================================================================

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { routeRequest } from '../worker/router.js';

let passed = 0;
let failed = 0;

function testAssert(condition, message) {
  if (condition) {
    passed++;
    console.log(`✅ [PASS] ${message}`);
  } else {
    failed++;
    console.error(`❌ [FAIL] ${message}`);
  }
}

console.log('='.repeat(70));
console.log(' UNIFIED CLOUDFLARE ROUTING TEST SUITE (drlohithjj.in)');
console.log('='.repeat(70) + '\n');

// ----------------------------------------------------------------
// SETUP MOCK ASSETS FETCHER & MOCK ENVIRONMENT
// ----------------------------------------------------------------
const mockFiles = {
  '/index.html': '<!DOCTYPE html><html><head><title>Dr. Lohith J.J. Portfolio</title></head><body>Public Site</body></html>',
  '/styles/main.css': '/* Public CSS */ body { background: #000; }',
  '/scripts/main.js': '// Public JS\nconsole.log("public");',
  '/dashboard/index.html': '<!DOCTYPE html><html><head><title>Admin Dashboard</title></head><body>Admin SPA Root</body></html>',
  '/dashboard/assets/index-test.js': '// Admin React Bundle',
  '/dashboard/assets/index-test.css': '/* Admin CSS */'
};

const mockAssetsFetcher = {
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;
    if (mockFiles[pathname]) {
      const isHtml = pathname.endsWith('.html');
      const isCss = pathname.endsWith('.css');
      const isJs = pathname.endsWith('.js');
      const contentType = isHtml ? 'text/html' : isCss ? 'text/css' : 'application/javascript';
      return new Response(mockFiles[pathname], {
        status: 200,
        headers: { 'Content-Type': contentType }
      });
    }
    return new Response('Not Found', { status: 404 });
  }
};

let insertedSyncRun = null;
const mockDb = {
  prepare(q) {
    let currentParams = [];
    return {
      bind(...params) {
        currentParams = params;
        return this;
      },
      first() {
        if (q.includes('profile')) return { id: 'profile', name: 'Dr. Lohith J.J.', version: 1 };
        if (q.includes('scholar_stats')) return { id: 'scholarStats', citations: 172, h_index: 8, i10_index: 8, version: 1 };
        if (q.includes('scholar_sync_runs')) return insertedSyncRun;
        return null;
      },
      all() { return { results: [] }; },
      run() {
        if (q.includes('INSERT INTO scholar_sync_runs')) {
          insertedSyncRun = {
            sync_run_id: currentParams[0],
            citations: currentParams[1],
            h_index: currentParams[2],
            i10_index: currentParams[3],
            payload_sha256: currentParams[4],
            status: 'success'
          };
        }
        return { success: true, meta: { changes: 1 } };
      }
    };
  }
};

const mockEnv = {
  DB: mockDb,
  ASSETS: mockAssetsFetcher,
  ENVIRONMENT: 'production',
  SCHOLAR_SYNC_SECRET: 'test-secret-12345'
};

// ----------------------------------------------------------------
// SUITE 1: PUBLIC PORTFOLIO STATIC SERVING
// ----------------------------------------------------------------
console.log('--- SUITE 1: PUBLIC PORTFOLIO STATIC SERVING ---');

// 1.1 Root path /
const reqRoot = new Request('https://drlohithjj.in/');
const resRoot = await routeRequest(reqRoot, mockEnv);
const textRoot = await resRoot.text();
testAssert(resRoot.status === 200, '1.1 GET / returns HTTP 200 OK');
testAssert(textRoot.includes('Public Site'), '1.2 GET / serves public index.html');

// 1.2 Public styles /styles/main.css
const reqCss = new Request('https://drlohithjj.in/styles/main.css');
const resCss = await routeRequest(reqCss, mockEnv);
testAssert(resCss.status === 200, '1.3 GET /styles/main.css returns HTTP 200 OK');
testAssert(resCss.headers.get('Content-Type') === 'text/css', '1.4 Content-Type is text/css');

// 1.3 Public scripts /scripts/main.js
const reqJs = new Request('https://drlohithjj.in/scripts/main.js');
const resJs = await routeRequest(reqJs, mockEnv);
testAssert(resJs.status === 200, '1.5 GET /scripts/main.js returns HTTP 200 OK');

// ----------------------------------------------------------------
// SUITE 2: ADMIN SPA ROUTING & SPA FALLBACK (/dashboard/*)
// ----------------------------------------------------------------
console.log('\n--- SUITE 2: ADMIN SPA ROUTING & SPA FALLBACK ---');

// 2.1 Direct /dashboard
const reqDash = new Request('https://drlohithjj.in/dashboard');
const resDash = await routeRequest(reqDash, mockEnv);
const textDash = await resDash.text();
testAssert(resDash.status === 200, '2.1 GET /dashboard returns HTTP 200 OK');
testAssert(textDash.includes('Admin SPA Root'), '2.2 GET /dashboard serves Admin index.html');

// 2.2 Trailing slash /dashboard/
const reqDashSlash = new Request('https://drlohithjj.in/dashboard/');
const resDashSlash = await routeRequest(reqDashSlash, mockEnv);
const textDashSlash = await resDashSlash.text();
testAssert(resDashSlash.status === 200, '2.3 GET /dashboard/ returns HTTP 200 OK');
testAssert(textDashSlash.includes('Admin SPA Root'), '2.4 GET /dashboard/ serves Admin index.html');

// 2.3 Nested client-side route /dashboard/publications (SPA fallback)
const reqDashPubs = new Request('https://drlohithjj.in/dashboard/publications');
const resDashPubs = await routeRequest(reqDashPubs, mockEnv);
const textDashPubs = await resDashPubs.text();
testAssert(resDashPubs.status === 200, '2.5 GET /dashboard/publications returns HTTP 200 OK');
testAssert(textDashPubs.includes('Admin SPA Root'), '2.6 Nested client route falls back to Admin index.html');

// 2.4 Nested client-side route /dashboard/talks
const reqDashTalks = new Request('https://drlohithjj.in/dashboard/talks');
const resDashTalks = await routeRequest(reqDashTalks, mockEnv);
testAssert(resDashTalks.status === 200, '2.7 GET /dashboard/talks returns HTTP 200 OK');

// 2.5 Admin static bundle file /dashboard/assets/index-test.js
const reqDashAsset = new Request('https://drlohithjj.in/dashboard/assets/index-test.js');
const resDashAsset = await routeRequest(reqDashAsset, mockEnv);
const textDashAsset = await resDashAsset.text();
testAssert(resDashAsset.status === 200, '2.8 GET /dashboard/assets/index-test.js returns HTTP 200 OK');
testAssert(textDashAsset.includes('Admin React Bundle'), '2.9 Real static asset under /dashboard/assets/ is served directly');

// ----------------------------------------------------------------
// SUITE 3: UNKNOWN PUBLIC ROUTE ISOLATION (NO LEAKAGE TO ADMIN)
// ----------------------------------------------------------------
console.log('\n--- SUITE 3: UNKNOWN PUBLIC ROUTE ISOLATION ---');

// 3.1 Unknown path /nonexistent-page must NOT return admin SPA
const reqUnknown = new Request('https://drlohithjj.in/nonexistent-page');
const resUnknown = await routeRequest(reqUnknown, mockEnv);
const jsonUnknown = await resUnknown.json();
testAssert(resUnknown.status === 404, '3.1 Unknown public path returns HTTP 404 Not Found');
testAssert(jsonUnknown.error?.code === 'NOT_FOUND', '3.2 Error code is NOT_FOUND');

// ----------------------------------------------------------------
// SUITE 4: SAME-ORIGIN API ROUTING
// ----------------------------------------------------------------
console.log('\n--- SUITE 4: SAME-ORIGIN API ROUTING ---');

// 4.1 Public API /api/v1/public/profile
const reqApiProfile = new Request('https://drlohithjj.in/api/v1/public/profile');
const resApiProfile = await routeRequest(reqApiProfile, mockEnv);
const jsonProfile = await resApiProfile.json();
testAssert(resApiProfile.status === 200, '4.1 GET /api/v1/public/profile returns HTTP 200 OK');
testAssert(jsonProfile.name === 'Dr. Lohith J.J.', '4.2 Public profile data correctly returned from D1');

// 4.2 Public API /api/v1/public/scholar-stats
const reqApiScholar = new Request('https://drlohithjj.in/api/v1/public/scholar-stats');
const resApiScholar = await routeRequest(reqApiScholar, mockEnv);
const jsonScholar = await resApiScholar.json();
testAssert(resApiScholar.status === 200, '4.3 GET /api/v1/public/scholar-stats returns HTTP 200 OK');
testAssert(jsonScholar.citations === 172, '4.4 Scholar stats citations match verified 172');

// 4.3 Admin API without auth /api/v1/admin/profile -> 401
const reqApiAdminUnauth = new Request('https://drlohithjj.in/api/v1/admin/profile');
const resApiAdminUnauth = await routeRequest(reqApiAdminUnauth, mockEnv);
const jsonAdminUnauth = await resApiAdminUnauth.json();
testAssert(resApiAdminUnauth.status === 401, '4.5 GET /api/v1/admin/profile without JWT returns HTTP 401 Unauthorized');
testAssert(jsonAdminUnauth.error?.code === 'UNAUTHORIZED', '4.6 Error code is UNAUTHORIZED');

// 4.4 Automation API /api/v1/automation/scholar without token -> 401
const reqApiAutoUnauth = new Request('https://drlohithjj.in/api/v1/automation/scholar', { method: 'POST' });
const resApiAutoUnauth = await routeRequest(reqApiAutoUnauth, mockEnv);
testAssert(resApiAutoUnauth.status === 401, '4.7 POST /api/v1/automation/scholar without Bearer token returns HTTP 401 Unauthorized');

// 4.5 Automation API with valid Bearer token -> 200
const reqApiAutoAuth = new Request('https://drlohithjj.in/api/v1/automation/scholar', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test-secret-12345'
  },
  body: JSON.stringify({
    syncRunId: `sync-run-${Date.now()}`,
    citations: 172,
    hIndex: 8,
    i10Index: 8
  })
});
const resApiAutoAuth = await routeRequest(reqApiAutoAuth, mockEnv);
testAssert(resApiAutoAuth.status === 200, '4.8 POST /api/v1/automation/scholar with Bearer token returns HTTP 200 OK');

// ----------------------------------------------------------------
// SUITE 5: RELATIVE URL CONFIGURATION INTEGRITY
// ----------------------------------------------------------------
console.log('\n--- SUITE 5: RELATIVE URL CONFIGURATION INTEGRITY ---');

const publicApiFile = fs.readFileSync(path.resolve('scripts/data/public-api.js'), 'utf-8');
testAssert(publicApiFile.includes("'/api/v1/public'"), '5.1 scripts/data/public-api.js defaults to relative /api/v1/public');
testAssert(!publicApiFile.includes('api.drlohithjj.com'), '5.2 No hardcoded api.drlohithjj.com in public-api.js');

const viteConfigFile = fs.readFileSync(path.resolve('admin/vite.config.ts'), 'utf-8');
testAssert(viteConfigFile.includes("base: '/dashboard/'"), '5.3 admin/vite.config.ts configured with base /dashboard/');

const wranglerConfigFile = fs.readFileSync(path.resolve('wrangler.toml'), 'utf-8');
testAssert(wranglerConfigFile.includes('directory = "./dist-site"'), '5.4 wrangler.toml configured with directory = ./dist-site');
testAssert(wranglerConfigFile.includes('binding = "ASSETS"'), '5.5 wrangler.toml configured with binding = ASSETS');

console.log('\n' + '='.repeat(70));
console.log(` UNIFIED ROUTING TEST SUITE RESULTS: ${passed}/${passed + failed} PASSED`);
console.log('='.repeat(70) + '\n');

if (failed > 0) process.exit(1);
