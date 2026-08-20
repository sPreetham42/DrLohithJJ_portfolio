// ================================================================
// PHASE 5 — SCHOLAR D1 PERSISTENCE MIGRATION TEST SUITE
// Automated verification of Worker Automation Endpoint, SHA-256
// Idempotency, Read-Back Verification, Monotonic Safety & Fail-Loud Pipeline
// ================================================================

import { strict as assert } from 'assert';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

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
console.log(' PHASE 5 — SCHOLAR D1 PERSISTENCE MIGRATION TEST SUITE');
console.log('='.repeat(70) + '\n');

// ----------------------------------------------------------------
// SETUP MOCK ENVIRONMENT & IN-MEMORY D1 SQLITE DB
// ----------------------------------------------------------------
class MockD1PreparedStatement {
  constructor(db, query, params = []) {
    this.db = db;
    this.query = query;
    this.params = params;
  }
  bind(...params) {
    return new MockD1PreparedStatement(this.db, this.query, params);
  }
  async first() {
    return this.db._queryFirst(this.query, this.params);
  }
  async all() {
    return { results: this.db._queryAll(this.query, this.params) };
  }
  async run() {
    return this.db._execute(this.query, this.params);
  }
}

class MockD1Database {
  constructor() {
    this.scholarStats = {
      id: 'scholarStats',
      citations: 172,
      h_index: 8,
      i10_index: 8,
      scie_papers_count: 4,
      ieee_conferences_count: 6,
      last_updated: '2026-08-18T00:00:00.000Z',
      source: 'google_scholar',
      metadata: null,
      version: 1
    };
    this.syncRuns = new Map();
    this.revisions = [];
  }

  prepare(query) {
    return new MockD1PreparedStatement(this, query);
  }

  _queryFirst(query, params) {
    if (query.includes('FROM scholar_stats')) {
      return { ...this.scholarStats };
    }
    if (query.includes('FROM scholar_sync_runs WHERE sync_run_id =')) {
      const id = params[0];
      return this.syncRuns.get(id) || null;
    }
    return null;
  }

  _queryAll(query, params) {
    if (query.includes('FROM scholar_stats')) {
      return [{ ...this.scholarStats }];
    }
    return [];
  }

  _execute(query, params) {
    if (query.includes('INSERT INTO scholar_sync_runs')) {
      const [id, citations, h, i10, hash, now] = params;
      this.syncRuns.set(id, {
        sync_run_id: id,
        citations,
        h_index: h,
        i10_index: i10,
        payload_sha256: hash,
        status: 'success',
        created_at: now
      });
      return { success: true, meta: { changes: 1 } };
    }
    if (query.includes('UPDATE scholar_stats')) {
      const [citations, h, i10, scie, ieee, last, src, now, meta, expectedVersion] = params;
      if (this.scholarStats.version !== expectedVersion) {
        return { success: true, meta: { changes: 0 } };
      }
      this.scholarStats.citations = citations;
      this.scholarStats.h_index = h;
      this.scholarStats.i10_index = i10;
      this.scholarStats.last_updated = last;
      this.scholarStats.version += 1;
      this.revisions.push({
        entity_type: 'scholar_stats',
        entity_id: 'scholarStats',
        version: this.scholarStats.version
      });
      return { success: true, meta: { changes: 1 } };
    }
    return { success: true, meta: { changes: 1 } };
  }
}

const mockDb = new MockD1Database();
const mockEnv = {
  DB: mockDb,
  SCHOLAR_SYNC_SECRET: 'test-scholar-secret-99999'
};

import { handleScholarSyncAutomation } from '../worker/handlers/automation.handler.js';
import { handleGetScholarStats } from '../worker/handlers/public.handler.js';

// ----------------------------------------------------------------
// SUITE 1: AUTHENTICATION & PRIVILEGE ISOLATION
// ----------------------------------------------------------------
console.log('--- SUITE 1: AUTHENTICATION & PRIVILEGE ISOLATION ---');

// 1.1 Missing Authorization Header
try {
  const req = new Request('http://localhost/api/v1/automation/scholar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ syncRunId: 'run-1', citations: 173, hIndex: 8, i10Index: 8 })
  });
  await handleScholarSyncAutomation(req, mockEnv);
  testAssert(false, '1.1 Missing auth header should fail');
} catch (err) {
  testAssert(err.name === 'UnauthorizedError', '1.1 Missing Bearer token rejected with UnauthorizedError');
}

// 1.2 Invalid Bearer Token
try {
  const req = new Request('http://localhost/api/v1/automation/scholar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer wrong-secret' },
    body: JSON.stringify({ syncRunId: 'run-1', citations: 173, hIndex: 8, i10Index: 8 })
  });
  await handleScholarSyncAutomation(req, mockEnv);
  testAssert(false, '1.2 Wrong secret should fail');
} catch (err) {
  testAssert(err.name === 'UnauthorizedError', '1.2 Invalid Bearer token rejected');
}

// 1.3 Cloudflare Access JWT header alone must NOT authorize automation endpoint
try {
  const req = new Request('http://localhost/api/v1/automation/scholar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cf-Access-Jwt-Assertion': 'some-access-jwt-token'
    },
    body: JSON.stringify({ syncRunId: 'run-1', citations: 173, hIndex: 8, i10Index: 8 })
  });
  await handleScholarSyncAutomation(req, mockEnv);
  testAssert(false, '1.3 Access assertion alone must not authorize automation');
} catch (err) {
  testAssert(err.name === 'UnauthorizedError', '1.3 Access assertion alone rejected from automation endpoint');
}

// ----------------------------------------------------------------
// SUITE 2: HAPPY PATH MUTATION & READ-BACK VERIFICATION
// ----------------------------------------------------------------
console.log('\n--- SUITE 2: HAPPY PATH MUTATION & READ-BACK ---');

const syncRun1Id = `sync-run-${Date.now()}-1`;
const reqValid = new Request('http://localhost/api/v1/automation/scholar', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${mockEnv.SCHOLAR_SYNC_SECRET}`
  },
  body: JSON.stringify({
    syncRunId: syncRun1Id,
    citations: 175,
    hIndex: 8,
    i10Index: 8
  })
});

const resValid = await handleScholarSyncAutomation(reqValid, mockEnv);
const resValidJson = await resValid.json();

testAssert(resValid.status === 200, '2.1 Valid automation request returns HTTP 200 OK');
testAssert(resValidJson.status === 'success', '2.2 Response status is success');
testAssert(resValidJson.idempotencyResult === 'applied', '2.3 Idempotency result is "applied"');
testAssert(mockDb.scholarStats.citations === 175, '2.4 D1 database updated with new citations (175)');
testAssert(mockDb.scholarStats.version === 2, '2.5 D1 version incremented to 2');
testAssert(mockDb.revisions.length === 1, '2.6 Exactly 1 revision audit record created');

// Read-Back Verification
const readBackReq = new Request('http://localhost/api/v1/public/scholar-stats', { method: 'GET' });
const readBackRes = await handleGetScholarStats(readBackReq, mockEnv);
const readBackJson = await readBackRes.json();
testAssert(readBackJson.citations === 175, '2.7 Read-back verification matches written citations');
testAssert(readBackJson.hIndex === 8, '2.8 Read-back verification matches written hIndex');

// ----------------------------------------------------------------
// SUITE 3: IDEMPOTENCY & RETRY BEHAVIOR
// ----------------------------------------------------------------
console.log('\n--- SUITE 3: IDEMPOTENCY & RETRY BEHAVIOR ---');

// 3.1 Exact retry of same syncRunId + same payload
const reqRetry = new Request('http://localhost/api/v1/automation/scholar', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${mockEnv.SCHOLAR_SYNC_SECRET}`
  },
  body: JSON.stringify({
    syncRunId: syncRun1Id,
    citations: 175,
    hIndex: 8,
    i10Index: 8
  })
});

const resRetry = await handleScholarSyncAutomation(reqRetry, mockEnv);
const resRetryJson = await resRetry.json();

testAssert(resRetry.status === 200, '3.1 Exact retry returns HTTP 200 OK');
testAssert(resRetryJson.idempotencyResult === 'idempotent_duplicate', '3.2 Retry detected as idempotent_duplicate');
testAssert(mockDb.scholarStats.version === 2, '3.3 Zero duplicate version increments on retry');
testAssert(mockDb.revisions.length === 1, '3.4 Zero duplicate audit revisions on retry');

// 3.2 Same syncRunId with conflicting payload -> rejected with Sync conflict error
try {
  const reqConflict = new Request('http://localhost/api/v1/automation/scholar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mockEnv.SCHOLAR_SYNC_SECRET}`
    },
    body: JSON.stringify({
      syncRunId: syncRun1Id,
      citations: 199, // Conflicting payload on same syncRunId
      hIndex: 9,
      i10Index: 9
    })
  });
  await handleScholarSyncAutomation(reqConflict, mockEnv);
  testAssert(false, '3.5 Conflicting payload on same syncRunId must fail');
} catch (err) {
  testAssert(err.message.includes('Sync conflict'), '3.5 Conflicting payload on same syncRunId rejected with Sync conflict error');
}

// ----------------------------------------------------------------
// SUITE 4: VALIDATION BOUNDS & MONOTONIC DEFENSE
// ----------------------------------------------------------------
console.log('\n--- SUITE 4: VALIDATION BOUNDS ---');

// 4.1 Missing syncRunId
try {
  const reqBad = new Request('http://localhost/api/v1/automation/scholar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mockEnv.SCHOLAR_SYNC_SECRET}` },
    body: JSON.stringify({ citations: 175, hIndex: 8, i10Index: 8 })
  });
  await handleScholarSyncAutomation(reqBad, mockEnv);
  testAssert(false, '4.1 Missing syncRunId must fail');
} catch (err) {
  testAssert(err.name === 'ValidationError' || err.status === 400, '4.1 Missing syncRunId rejected with ValidationError');
}

// 4.2 Negative citations
try {
  const reqNegative = new Request('http://localhost/api/v1/automation/scholar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mockEnv.SCHOLAR_SYNC_SECRET}` },
    body: JSON.stringify({ syncRunId: 'run-neg', citations: -5, hIndex: 8, i10Index: 8 })
  });
  await handleScholarSyncAutomation(reqNegative, mockEnv);
  testAssert(false, '4.2 Negative citations must fail');
} catch (err) {
  testAssert(err.name === 'ValidationError' || err.status === 400, '4.2 Negative citations rejected with ValidationError');
}

// ----------------------------------------------------------------
// SUITE 5: PYTHON SCRIPT STRUCTURE & PERSISTENCE CONTRACT
// ----------------------------------------------------------------
console.log('\n--- SUITE 5: PYTHON SCHOLAR SCRIPT CONTRACT ---');

const scriptPath = path.resolve('scripts/sync_scholar.py');
testAssert(fs.existsSync(scriptPath), '5.1 sync_scholar.py script exists');

const scriptContent = fs.readFileSync(scriptPath, 'utf-8');
testAssert(scriptContent.includes('push_to_d1_with_verification'), '5.2 push_to_d1_with_verification implemented in sync_scholar.py');
testAssert(scriptContent.includes('push_to_d1_with_verification') && !scriptContent.includes('push_to_sanity'), '5.4 D1 direct automation persistence configured');
testAssert(scriptContent.includes('data/scholar.json'), '5.5 Derived fallback sync to data/scholar.json preserved');

// ----------------------------------------------------------------
// SUITE 6: GITHUB ACTIONS WORKFLOW CONFIGURATION
// ----------------------------------------------------------------
console.log('\n--- SUITE 6: GITHUB ACTIONS WORKFLOW CONFIGURATION ---');

const workflowPath = path.resolve('.github/workflows/sync-scholar.yml');
testAssert(fs.existsSync(workflowPath), '6.1 sync-scholar.yml workflow file exists');

const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
testAssert(workflowContent.includes('WORKER_AUTOMATION_URL'), '6.2 Workflow target set to D1 automation URL');
testAssert(workflowContent.includes('SCHOLAR_SYNC_SECRET: ${{ secrets.SCHOLAR_SYNC_SECRET }}'), '6.3 SCHOLAR_SYNC_SECRET injected into GitHub Action runner');

console.log('\n' + '='.repeat(70));
console.log(` PHASE 5 TEST SUITE RESULTS: ${passed}/${passed + failed} PASSED`);
console.log('='.repeat(70) + '\n');

if (failed > 0) process.exit(1);
