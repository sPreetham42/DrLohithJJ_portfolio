// ================================================================
// PHASE 9A — PROFILE ASSET FOREIGN-KEY INTEGRITY REGRESSION SUITE
// ================================================================

import fs from 'fs';
import path from 'path';
import worker from '../worker/index.js';
import { normalizeSnapshot } from '../migration/normalize_snapshot.js';
import { validateSnapshot } from '../migration/validate_snapshot.js';

const ROOT_DIR = path.resolve('.');
const SNAPSHOT_PATH = path.join(ROOT_DIR, 'current-portfolio-snapshot.json');
const MIGRATION_PATH = path.join(ROOT_DIR, 'db', 'migrations', '0005_fix_profile_photo_asset_fk.sql');

console.log('\n' + '='.repeat(70));
console.log(' PHASE 9A — PROFILE ASSET FOREIGN-KEY INTEGRITY TEST SUITE');
console.log('='.repeat(70) + '\n');

let passed = 0;
let failed = 0;

function assert(cond, desc) {
  if (cond) {
    console.log(`  ✅ [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${desc}`);
    failed++;
  }
}

// ----------------------------------------------------------------
// Helper: Create Mock Cloudflare Access JWT Assertion
// ----------------------------------------------------------------
function createMockJwt(email, expSec = Math.floor(Date.now() / 1000) + 3600, overrides = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    email,
    sub: `user-${email}`,
    iss: 'https://test.cloudflareaccess.com',
    aud: 'test-aud',
    exp: expSec,
    ...overrides
  })).toString('base64url');
  const signature = Buffer.from('mock-valid-signature').toString('base64url');
  return `${header}.${payload}.${signature}`;
}

// ----------------------------------------------------------------
// SUITE 1: CANONICAL SNAPSHOT & VALIDATOR INTEGRITY
// ----------------------------------------------------------------
console.log('--- SUITE 1: CANONICAL SNAPSHOT & VALIDATOR INTEGRITY ---');

const snapshot = normalizeSnapshot(SNAPSHOT_PATH);
assert(snapshot.profile.photoAsset === 'asset-headshot', '1.1 Snapshot profile.photoAsset is normalized to "asset-headshot"');

const headshotAsset = snapshot.assets.find(a => a.id === 'asset-headshot');
assert(headshotAsset !== undefined, '1.2 Headshot asset exists in assets array');
assert(headshotAsset.localPath === 'assets/Dr Lohith J J.jpeg', '1.3 Headshot asset localPath is "assets/Dr Lohith J J.jpeg"');

const validationResult = validateSnapshot(SNAPSHOT_PATH);
assert(validationResult.success === true, '1.4 Canonical snapshot passes strict relational schema validation');

// ----------------------------------------------------------------
// SUITE 2: MIGRATION 0005 SQL DETERMINISM & LOGIC
// ----------------------------------------------------------------
console.log('\n--- SUITE 2: MIGRATION 0005 SQL LOGIC ---');

assert(fs.existsSync(MIGRATION_PATH), '2.1 Migration 0005 file exists');
const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf-8').replace(/\s+/g, ' ');
assert(migrationSql.includes('UPDATE profile'), '2.2 Migration updates profile table');
assert(migrationSql.includes('SELECT id FROM assets WHERE storage_key = profile.photo_asset_id'), '2.3 Migration safely resolves storage_key to assets.id');
assert(migrationSql.includes('WHERE photo_asset_id IS NOT NULL'), '2.4 Migration includes safe NULL filter');

// ----------------------------------------------------------------
// SUITE 3: IN-MEMORY RELATIONAL MOCK WITH FOREIGN KEY ENFORCEMENT
// ----------------------------------------------------------------
console.log('\n--- SUITE 3: WORKER API RELATIONAL INTEGRITY ---');

const dbStore = {
  profile: {
    ...snapshot.profile,
    years_experience: snapshot.profile.yearsExperience,
    current_institution: snapshot.profile.currentInstitution,
    hero_description_line1: snapshot.profile.heroDescriptionLine1,
    hero_description_line2: snapshot.profile.heroDescriptionLine2,
    email_primary: snapshot.profile.emailPrimary,
    email_secondary: snapshot.profile.emailSecondary,
    photo_asset_id: 'asset-headshot',
    additional_roles_json: JSON.stringify(snapshot.profile.additionalRoles),
    professional_memberships_json: JSON.stringify(snapshot.profile.professionalMemberships),
    version: 1,
    updated_at: new Date().toISOString(),
    metadata: null
  },
  scholar_stats: {
    id: 'scholarStats',
    citations: snapshot.scholarStats.citations,
    h_index: snapshot.scholarStats.hIndex,
    i10_index: snapshot.scholarStats.i10Index,
    scie_papers_count: snapshot.scholarStats.sciePapersCount,
    ieee_conferences_count: snapshot.scholarStats.ieeeConferencesCount,
    last_updated: snapshot.scholarStats.lastUpdated,
    source: snapshot.scholarStats.source,
    version: 1,
    updated_at: new Date().toISOString(),
    metadata: null
  },
  assets: new Map(snapshot.assets.map(a => [a.id, {
    id: a.id,
    storage_key: a.localPath,
    filename: a.filename,
    mime_type: a.mimeType,
    byte_size: a.byteSize,
    is_primary_photo: a.isPrimaryPhoto ? 1 : 0,
    created_at: new Date().toISOString(),
    metadata: null
  }])),
  publications: new Map(),
  revisions: []
};

// Mock D1 that strictly enforces Foreign Key to assets table
const mockDb = {
  prepare: (sql) => {
    let boundParams = [];
    const executor = {
      bind: (...args) => {
        boundParams = args;
        return executor;
      },
      first: async () => {
        if (sql.includes('FROM profile')) return dbStore.profile;
        if (sql.includes('FROM scholar_stats')) return dbStore.scholar_stats;
        if (sql.includes('FROM assets WHERE id =')) {
          return dbStore.assets.get(boundParams[0]) || null;
        }
        if (sql.includes('FROM assets WHERE storage_key =')) {
          const found = Array.from(dbStore.assets.values()).find(a => a.storage_key === boundParams[0]);
          return found ? { id: found.id, storage_key: found.storage_key } : null;
        }
        return null;
      },
      all: async () => {
        if (sql.includes('FROM assets')) {
          return { results: Array.from(dbStore.assets.values()) };
        }
        return { results: [] };
      },
      run: async () => {
        if (sql.includes('UPDATE profile SET')) {
          const photoAssetId = boundParams[11];
          // STRICT RELATIONAL FOREIGN KEY CHECK
          if (photoAssetId !== null && !dbStore.assets.has(photoAssetId)) {
            throw new Error(`D1_ERROR: FOREIGN KEY constraint failed on photo_asset_id: ${photoAssetId}`);
          }
          const expectedVersion = boundParams[boundParams.length - 1];
          if (dbStore.profile.version !== expectedVersion) {
            return { success: false, meta: { changes: 0 } };
          }
          dbStore.profile.name = boundParams[0];
          dbStore.profile.credential = boundParams[1];
          dbStore.profile.designation = boundParams[2];
          dbStore.profile.years_experience = boundParams[3];
          dbStore.profile.photo_asset_id = photoAssetId;
          dbStore.profile.version += 1;
          dbStore.profile.updated_at = new Date().toISOString();
          return { success: true, meta: { changes: 1 } };
        }
        if (sql.includes('INSERT INTO revisions')) {
          dbStore.revisions.push(boundParams);
          return { success: true, meta: { changes: 1 } };
        }
        return { success: true, meta: { changes: 1 } };
      }
    };
    return executor;
  }
};

const mockEnv = {
  DB: mockDb,
  ENVIRONMENT: 'test',
  ADMIN_EMAILS: 'lohithjj@gmail.com',
  ACCESS_AUDIENCE: 'test-aud',
  ACCESS_ISSUER: 'https://test.cloudflareaccess.com',
  AUTH_MODE: 'ACCESS'
};

const adminJwt = createMockJwt('lohithjj@gmail.com');
const adminHeaders = {
  'Cf-Access-Jwt-Assertion': adminJwt,
  'Content-Type': 'application/json'
};

// ----------------------------------------------------------------
// SUITE 4: PUBLIC API ASSET RESOLUTION
// ----------------------------------------------------------------
console.log('\n--- SUITE 4: PUBLIC API ASSET RESOLUTION ---');

const publicReq = new Request('http://localhost/api/v1/public/profile');
const publicRes = await worker.fetch(publicReq, mockEnv, {});
assert(publicRes.status === 200, '4.1 GET /api/v1/public/profile returns HTTP 200');
const publicData = await publicRes.json();
assert(publicData.photoAsset === 'assets/Dr Lohith J J.jpeg', '4.2 publicData.photoAsset resolves to storage_key');
assert(publicData.photoUrl === 'assets/Dr Lohith J J.jpeg', '4.3 publicData.photoUrl resolves to storage_key');
assert(publicData.photoAssetId === 'asset-headshot', '4.4 publicData.photoAssetId contains canonical DB foreign key');

// ----------------------------------------------------------------
// SUITE 5: ADMIN API GET PROFILE
// ----------------------------------------------------------------
console.log('\n--- SUITE 5: ADMIN API GET PROFILE ---');

const adminGetReq = new Request('http://localhost/api/v1/admin/profile', {
  headers: adminHeaders
});
const adminGetRes = await worker.fetch(adminGetReq, mockEnv, {});
assert(adminGetRes.status === 200, '5.1 GET /api/v1/admin/profile returns HTTP 200');
const adminGetData = await adminGetRes.json();
assert(adminGetData.photo_asset_id === 'asset-headshot', '5.2 Admin GET returns normalized photo_asset_id: "asset-headshot"');

// ----------------------------------------------------------------
// SUITE 6: ADMIN UPDATE WITH CANONICAL ASSET ID
// ----------------------------------------------------------------
console.log('\n--- SUITE 6: ADMIN UPDATE WITH CANONICAL ASSET ID ---');

const updateWithIdReq = new Request('http://localhost/api/v1/admin/profile', {
  method: 'PUT',
  headers: adminHeaders,
  body: JSON.stringify({
    version: dbStore.profile.version,
    data: {
      name: 'Dr. Lohith J.J.',
      credential: 'Ph.D. — NIT Trichy',
      designation: 'Professor & Head of Department',
      yearsExperience: 20,
      currentInstitution: 'NCET, Bengaluru',
      heroDescriptionLine1: 'Hero line 1',
      heroDescriptionLine2: 'Hero line 2',
      emailPrimary: 'lohithjj@gmail.com',
      phone: '+91-9886745882',
      address: 'NCET, Bengaluru',
      photoAsset: 'asset-headshot', // Exact Asset ID
      additionalRoles: [],
      professionalMemberships: []
    }
  })
});
const updateWithIdRes = await worker.fetch(updateWithIdReq, mockEnv, {});
assert(updateWithIdRes.status === 200, '6.1 Profile update with valid asset ID succeeds with HTTP 200');
const updateWithIdData = await updateWithIdRes.json();
assert(updateWithIdData.photo_asset_id === 'asset-headshot', '6.2 Updated row maintains photo_asset_id: "asset-headshot"');
assert(updateWithIdData.version === 2, '6.3 Version incremented to 2');

// ----------------------------------------------------------------
// SUITE 7: ADMIN UPDATE WITH STORAGE KEY (TRANSPARENT BOUNDARY RESOLUTION)
// ----------------------------------------------------------------
console.log('\n--- SUITE 7: ADMIN UPDATE WITH STORAGE KEY RESOLUTION ---');

const updateWithKeyReq = new Request('http://localhost/api/v1/admin/profile', {
  method: 'PUT',
  headers: adminHeaders,
  body: JSON.stringify({
    version: dbStore.profile.version,
    data: {
      name: 'Dr. Lohith J.J.',
      credential: 'Ph.D. — NIT Trichy',
      designation: 'Professor & Head of Department',
      yearsExperience: 20,
      currentInstitution: 'NCET, Bengaluru',
      heroDescriptionLine1: 'Hero line 1',
      heroDescriptionLine2: 'Hero line 2',
      emailPrimary: 'lohithjj@gmail.com',
      phone: '+91-9886745882',
      address: 'NCET, Bengaluru',
      photoAsset: 'assets/Dr Lohith J J.jpeg', // Storage Key transparently resolved
      additionalRoles: [],
      professionalMemberships: []
    }
  })
});
const updateWithKeyRes = await worker.fetch(updateWithKeyReq, mockEnv, {});
assert(updateWithKeyRes.status === 200, '7.1 Profile update with storage key transparently resolves and succeeds with HTTP 200');
const updateWithKeyData = await updateWithKeyRes.json();
assert(updateWithKeyData.photo_asset_id === 'asset-headshot', '7.2 DB stores normalized asset ID "asset-headshot", not storage key');

// ----------------------------------------------------------------
// SUITE 8: INVALID ASSET ID REJECTION (ERROR BOUNDARY)
// ----------------------------------------------------------------
console.log('\n--- SUITE 8: INVALID ASSET ID ERROR HANDLING ---');

const updateInvalidAssetReq = new Request('http://localhost/api/v1/admin/profile', {
  method: 'PUT',
  headers: adminHeaders,
  body: JSON.stringify({
    version: dbStore.profile.version,
    data: {
      name: 'Dr. Lohith J.J.',
      designation: 'Professor & Head of Department',
      yearsExperience: 20,
      currentInstitution: 'NCET',
      heroDescriptionLine1: 'Line 1',
      heroDescriptionLine2: 'Line 2',
      emailPrimary: 'lohithjj@gmail.com',
      phone: '+91-9886745882',
      address: 'NCET',
      photoAsset: 'non-existent-asset-999', // Invalid asset ID
      additionalRoles: [],
      professionalMemberships: []
    }
  })
});
const updateInvalidAssetRes = await worker.fetch(updateInvalidAssetReq, mockEnv, {});
assert(updateInvalidAssetRes.status === 400, '8.1 Nonexistent asset ID cleanly returns HTTP 400 ValidationError');
const invalidBody = await updateInvalidAssetRes.json();
assert(invalidBody.error.code === 'VALIDATION_ERROR', '8.2 Error code is VALIDATION_ERROR');
assert(invalidBody.error.message.includes('non-existent-asset-999'), '8.3 Error message identifies the invalid asset');

// ----------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------
console.log('\n' + '='.repeat(70));
console.log(` PHASE 9A INTEGRITY SUITE: ${passed} PASSED, ${failed} FAILED`);
console.log('='.repeat(70) + '\n');

if (failed > 0) {
  process.exit(1);
}
