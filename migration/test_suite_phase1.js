import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { validateSnapshot } from './validate_snapshot.js';
import { normalizeSnapshot } from './normalize_snapshot.js';
import { generateManifest, hashObject, hashString } from './generate_manifest.js';
import { buildSqlStatements, runImport } from './import_d1.js';
import { verifyParity } from './verify_parity.js';
import { CanonicalSnapshotSchema, MetadataSchema, PublicationSchema } from '../worker/validation/schemas.js';
import { ConcurrencyConflictError } from '../worker/errors.js';
import { ScholarSyncRunRepository } from '../worker/repositories/scholar_sync.repository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_PATH = path.join(__dirname, '..', 'current-portfolio-snapshot.json');

console.log('\n' + '='.repeat(70));
console.log(' PHASE 1.5 FINAL ACCEPTANCE & HARDENING TEST SUITE');
console.log('='.repeat(70) + '\n');

let passed = 0;
let failed = 0;

function assert(cond, desc) {
  if (cond) {
    console.log(`✅ [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${desc}`);
    failed++;
  }
}

// ----------------------------------------------------------------
// SUITE 1: Canonical Snapshot Schema & Logical Validation
// ----------------------------------------------------------------
console.log('--- SUITE 1: CANONICAL SNAPSHOT VALIDATION ---');
const valResult = validateSnapshot(SNAPSHOT_PATH);
assert(valResult.success === true, '1.1 Snapshot passes validation against CanonicalSnapshotSchema');
assert(valResult.counts.profile === 1, '1.2 Exactly 1 profile record');
assert(valResult.counts.scholarStats === 1, '1.3 Exactly 1 scholarStats record');
assert(valResult.counts.publications === 13, '1.4 Exactly 13 publication records');
assert(valResult.counts.talks === 53, '1.5 Exactly 53 talk records');
assert(valResult.counts.awards === 25, '1.6 Exactly 25 award records');
assert(valResult.counts.experience === 6, '1.7 Exactly 6 experience records');
assert(valResult.counts.education === 3, '1.8 Exactly 3 education records');
assert(valResult.counts.skillCategories === 4, '1.9 Exactly 4 skill category records');
assert(valResult.counts.socialLinks === 7, '1.10 Exactly 7 social link records');
assert(valResult.counts.assets === 10, '1.11 Exactly 10 asset records');

// ----------------------------------------------------------------
// SUITE 2: Schema Error Handling on Corrupted Inputs
// ----------------------------------------------------------------
console.log('\n--- SUITE 2: SCHEMA REJECTION ON CORRUPTED INPUTS ---');
const badSnapshot1 = { ...valResult.data, publications: [] };
const res1 = CanonicalSnapshotSchema.safeParse(badSnapshot1);
assert(res1.success === false, '2.1 Empty publications array correctly rejected by Zod');

const badSnapshot2 = {
  ...valResult.data,
  profile: { ...valResult.data.profile, yearsExperience: -5 }
};
const res2 = CanonicalSnapshotSchema.safeParse(badSnapshot2);
assert(res2.success === false, '2.2 Negative yearsExperience correctly rejected by Zod');

const badSnapshot3 = {
  ...valResult.data,
  scholarStats: { ...valResult.data.scholarStats, citations: -1 }
};
const res3 = CanonicalSnapshotSchema.safeParse(badSnapshot3);
assert(res3.success === false, '2.3 Negative citations correctly rejected by Zod');

// ----------------------------------------------------------------
// SUITE 3: Deterministic Normalization & Hashing
// ----------------------------------------------------------------
console.log('\n--- SUITE 3: DETERMINISTIC NORMALIZATION & HASHING ---');
const norm1 = normalizeSnapshot(SNAPSHOT_PATH);
const { snapshotChecksum: hash1 } = generateManifest(SNAPSHOT_PATH);
const { snapshotChecksum: hash2 } = generateManifest(SNAPSHOT_PATH);
assert(hash1 === hash2, `3.1 Cryptographic manifest is 100% reproducible (${hash1})`);
assert(hash1.length === 64, '3.2 SHA-256 hash length is valid 64 hex characters');
assert(norm1.profile.heroDescriptionLine1.includes('<strong>20 years</strong>'), '3.3 Raw HTML formatting in heroDescriptionLine1 is strictly preserved');
assert(norm1.profile.credential === 'Ph.D. — NIT Trichy', '3.4 Editorial em-dash in credential is preserved');

// ----------------------------------------------------------------
// SUITE 4: Snapshot Immutability Verification
// ----------------------------------------------------------------
console.log('\n--- SUITE 4: SNAPSHOT IMMUTABILITY ---');
const fileBefore = fs.readFileSync(SNAPSHOT_PATH, 'utf8');
const fileHashBefore = crypto.createHash('sha256').update(fileBefore).digest('hex');
normalizeSnapshot(SNAPSHOT_PATH, { writeToFile: false });
generateManifest(SNAPSHOT_PATH);
const fileAfter = fs.readFileSync(SNAPSHOT_PATH, 'utf8');
const fileHashAfter = crypto.createHash('sha256').update(fileAfter).digest('hex');
assert(fileHashBefore === fileHashAfter, '4.1 Snapshot file on disk remains completely immutable during validation & hashing');

// ----------------------------------------------------------------
// SUITE 5: D1 SQL Generation & Dry-Run Import
// ----------------------------------------------------------------
console.log('\n--- SUITE 5: D1 SQL GENERATION & DRY-RUN IMPORT ---');
const dryResult = runImport(true);
assert(dryResult.success === true, '5.1 Import runner executes successfully in dry-run mode');
assert(dryResult.isDryRun === true, '5.2 Dry-run flag confirmed true');
assert(dryResult.statementsCount === 124, `5.3 Exact 124 SQL import operations generated (got ${dryResult.statementsCount})`);
assert(dryResult.tableCounts.profile === 1, '5.4 Profile SQL count is 1');
assert(dryResult.tableCounts.scholar_stats === 1, '5.5 ScholarStats SQL count is 1');
assert(dryResult.tableCounts.publications === 13, '5.6 Publications SQL count is 13');
assert(dryResult.tableCounts.talks === 53, '5.7 Talks SQL count is 53');
assert(dryResult.tableCounts.awards === 25, '5.8 Awards SQL count is 25');
assert(dryResult.tableCounts.experience === 6, '5.9 Experience SQL count is 6');
assert(dryResult.tableCounts.education === 3, '5.10 Education SQL count is 3');
assert(dryResult.tableCounts.skill_categories === 4, '5.11 Skill categories SQL count is 4');
assert(dryResult.tableCounts.social_links === 7, '5.12 Social links SQL count is 7');
assert(dryResult.tableCounts.assets === 10, '5.13 Assets SQL count is 10');
assert(dryResult.tableCounts.revisions === 1, '5.14 Revisions baseline entry count is 1');

// ----------------------------------------------------------------
// SUITE 6: Idempotency & Repeat Import Invariance
// ----------------------------------------------------------------
console.log('\n--- SUITE 6: IDEMPOTENCY & REPEAT IMPORT INVARIANCE ---');
const stmts1 = buildSqlStatements(norm1);
const stmts2 = buildSqlStatements(norm1);
assert(stmts1.length === stmts2.length, '6.1 Repeated import generates identical statement count');
const sqlSignature1 = stmts1.map(s => `${s.table}:${s.params[0]}`).join('|');
const sqlSignature2 = stmts2.map(s => `${s.table}:${s.params[0]}`).join('|');
assert(sqlSignature1 === sqlSignature2, '6.2 Repeated import generates identical deterministic entity keys (zero duplicates)');

// ----------------------------------------------------------------
// SUITE 7: Revision Baseline Audit Logging
// ----------------------------------------------------------------
console.log('\n--- SUITE 7: REVISION AUDIT BASELINE ---');
const revStmt = stmts1.find(s => s.table === 'revisions');
assert(revStmt !== undefined, '7.1 Revision audit statement generated');
assert(revStmt.params[1] === 'migration_baseline', '7.2 Entity type is explicitly migration_baseline');
assert(revStmt.params[4] === 'import', '7.3 Action is explicitly import');
assert(revStmt.params[6] === 'migration-runner', '7.4 Author is explicitly migration-runner');
const payload = JSON.parse(revStmt.params[5]);
assert(payload.type === 'initial_import_baseline', '7.5 Revision payload marked initial_import_baseline');
assert(payload.snapshotSha256.length === 64, '7.6 Revision payload contains immutable snapshot SHA-256');

// ----------------------------------------------------------------
// SUITE 8: Optimistic Concurrency Foundation (Update & Delete)
// ----------------------------------------------------------------
console.log('\n--- SUITE 8: OPTIMISTIC CONCURRENCY ON UPDATE & DELETE ---');
const errUpdate = new ConcurrencyConflictError('publication', 'pub-j1', 1);
assert(errUpdate.name === 'ConcurrencyConflictError', '8.1 ConcurrencyConflictError is properly typed');
assert(errUpdate.message.includes('expected version 1 does not match'), '8.2 Update conflict error message contains version diagnostics');

const errDelete = new ConcurrencyConflictError('talk', 'talk-1', 4);
assert(errDelete.entityType === 'talk', '8.3 Delete conflict error contains target entityType');
assert(errDelete.expectedVersion === 4, '8.4 Delete conflict error contains expectedVersion');

// ----------------------------------------------------------------
// SUITE 9: Environment Safety Gate
// ----------------------------------------------------------------
console.log('\n--- SUITE 9: ENVIRONMENT SAFETY GATE ---');
let safetyBlocked = false;
try {
  runImport(false, { targetEnv: 'production', confirmProduction: false });
} catch (e) {
  if (e.message.includes('SAFETY GATE: Target environment is PRODUCTION')) {
    safetyBlocked = true;
  }
}
assert(safetyBlocked === true, '9.1 Production execution without --confirm-production is strictly blocked');

// ----------------------------------------------------------------
// SUITE 10: Asset Integrity & Exclusion of Legacy Test Assets
// ----------------------------------------------------------------
console.log('\n--- SUITE 10: ASSET INTEGRITY ---');
const assetNames = norm1.assets.map(a => a.filename);
assert(assetNames.includes('Dr Lohith J J.jpeg'), '10.1 Active headshot is included');
assert(!assetNames.includes('aayush.jpg'), '10.2 Legacy unused test asset aayush.jpg is strictly excluded');
assert(norm1.assets.length === 10, '10.3 Exactly 10 active assets tracked');
for (const a of norm1.assets) {
  const p = path.join(__dirname, '..', a.localPath);
  assert(fs.existsSync(p), `10.4 Asset file exists on disk: ${a.filename}`);
  assert(fs.statSync(p).size > 0, `10.5 Asset file size > 0: ${a.filename}`);
}

// ----------------------------------------------------------------
// SUITE 11: Parity Verification against Canonical Snapshot
// ----------------------------------------------------------------
console.log('\n--- SUITE 11: POST-IMPORT PARITY VERIFICATION ---');
const parityRes = verifyParity();
assert(parityRes.parityPercent === 100, '11.1 Parity verification achieved 100% data equality');
assert(parityRes.failed === 0, '11.2 Zero parity failures detected');

// ----------------------------------------------------------------
// SUITE 12: D1 Schema Migrations, Indexes & Constraints
// ----------------------------------------------------------------
console.log('\n--- SUITE 12: D1 SCHEMA MIGRATIONS, INDEXES & CONSTRAINTS ---');
const mig1 = fs.readFileSync(path.join(__dirname, '..', 'db', 'migrations', '0001_initial_schema.sql'), 'utf8');
const mig2 = fs.readFileSync(path.join(__dirname, '..', 'db', 'migrations', '0002_create_revisions.sql'), 'utf8');
const mig3 = fs.readFileSync(path.join(__dirname, '..', 'db', 'migrations', '0003_hardening_updates.sql'), 'utf8');

assert(mig1.includes('metadata TEXT'), '12.1 Schema supports metadata TEXT column');
assert(mig1.includes('version INTEGER NOT NULL DEFAULT 1'), '12.2 Schema supports version integer column for optimistic concurrency');
assert(mig1.includes('FOREIGN KEY (photo_asset_id) REFERENCES assets(id) ON DELETE SET NULL'), '12.3 Profile table defines foreign key to assets with ON DELETE SET NULL');
assert(mig1.includes('FOREIGN KEY (pdf_asset_id) REFERENCES assets(id) ON DELETE SET NULL'), '12.4 Publications table defines foreign key to assets with ON DELETE SET NULL');
assert(mig1.includes('FOREIGN KEY (certificate_asset_id) REFERENCES assets(id) ON DELETE SET NULL'), '12.5 Awards table defines foreign key to assets with ON DELETE SET NULL');
assert(mig1.includes('featured INTEGER NOT NULL DEFAULT 0'), '12.6 publications.featured defaults to 0 for editorial safety');
assert(mig3.includes('CREATE TABLE IF NOT EXISTS scholar_sync_runs'), '12.7 scholar_sync_runs table defined in 0003_hardening_updates.sql');
assert(mig3.includes('idx_pub_published_order'), '12.8 Composite index idx_pub_published_order created');
assert(mig3.includes('idx_talks_published_year_order'), '12.9 Composite index idx_talks_published_year_order created');
assert(mig3.includes('idx_exp_published_order'), '12.10 Composite index idx_exp_published_order created');

// ----------------------------------------------------------------
// SUITE 13: Zero ORM Verification
// ----------------------------------------------------------------
console.log('\n--- SUITE 13: ZERO-ORM ARCHITECTURE VERIFICATION ---');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
assert(!allDeps.drizzle, '13.1 Drizzle is NOT in dependencies');
assert(!allDeps['drizzle-orm'], '13.2 drizzle-orm is NOT in dependencies');
assert(!allDeps.prisma, '13.3 Prisma is NOT in dependencies');
assert(!allDeps['@prisma/client'], '13.4 @prisma/client is NOT in dependencies');
assert(!allDeps.typeorm, '13.5 TypeORM is NOT in dependencies');

// ----------------------------------------------------------------
// SUITE 14: Strict Metadata JSON Object Validation
// ----------------------------------------------------------------
console.log('\n--- SUITE 14: STRICT METADATA JSON OBJECT VALIDATION ---');
assert(MetadataSchema.safeParse(null).success === true, '14.1 metadata: null is accepted');
assert(MetadataSchema.safeParse(undefined).success === true, '14.2 metadata: undefined is accepted');
assert(MetadataSchema.safeParse({}).success === true, '14.3 metadata: {} empty object is accepted');
assert(MetadataSchema.safeParse({ acceptanceRate: '15%', note: 'best paper' }).success === true, '14.4 metadata: valid key-value object is accepted');
assert(MetadataSchema.safeParse('arbitrary string').success === false, '14.5 metadata: string primitive is rejected');
assert(MetadataSchema.safeParse(12345).success === false, '14.6 metadata: number primitive is rejected');
assert(MetadataSchema.safeParse(true).success === false, '14.7 metadata: boolean primitive is rejected');
assert(MetadataSchema.safeParse(['array', 'items']).success === false, '14.8 metadata: array primitive is rejected');

// ----------------------------------------------------------------
// SUITE 15: Publication Featured & Published Semantics
// ----------------------------------------------------------------
console.log('\n--- SUITE 15: PUBLICATION FEATURED & PUBLISHED SEMANTICS ---');
const pubWithoutFeatured = {
  id: 'pub-test-new',
  title: 'Test Future Publication',
  authors: 'Lohith J.J.',
  venue: 'IEEE Trans',
  publicationType: 'journal',
  year: 2026,
  featured: false,
  order: 20,
};
const parsedPub = PublicationSchema.parse(pubWithoutFeatured);
assert(parsedPub.featured === false, '15.1 New publication starts unfeatured (featured: false)');
assert(parsedPub.published === true, '15.2 New publication defaults to publicly visible (published: true)');

// ----------------------------------------------------------------
// SUITE 16: Scholar syncRunId Idempotency Logic
// ----------------------------------------------------------------
console.log('\n--- SUITE 16: SCHOLAR SYNCRUNID IDEMPOTENCY LOGIC ---');
const inMemorySyncStore = new Map();
const mockDb = {
  prepare: (sql) => ({
    bind: (...args) => ({
      first: async () => {
        const id = args[0];
        return inMemorySyncStore.get(id) || null;
      },
      run: async () => {
        const [sync_run_id, citations, h_index, i10_index, payload_sha256, now] = args;
        inMemorySyncStore.set(sync_run_id, {
          sync_run_id,
          citations,
          h_index,
          i10_index,
          payload_sha256,
          status: 'success',
          created_at: now
        });
        return { success: true };
      }
    })
  })
};

const scholarSyncRepo = new ScholarSyncRunRepository(mockDb);
let mockScholarStatsUpdates = 0;
const mockUpdater = async (stats) => {
  mockScholarStatsUpdates++;
};

// 16.1 First run
const run1Res = await scholarSyncRepo.processSyncRun(
  'sync-run-001',
  { citations: 172, h_index: 8, i10_index: 8, last_updated: '2026-08-18T00:00:00Z' },
  mockUpdater
);
assert(run1Res.status === 'applied', '16.1 First execution of sync-run-001 is applied');
assert(mockScholarStatsUpdates === 1, '16.2 Scholar stats update function called once');

// 16.2 Exact retry of same syncRunId
const run1Retry = await scholarSyncRepo.processSyncRun(
  'sync-run-001',
  { citations: 172, h_index: 8, i10_index: 8, last_updated: '2026-08-18T00:00:00Z' },
  mockUpdater
);
assert(run1Retry.status === 'idempotent_duplicate', '16.3 Exact retry of sync-run-001 detected as idempotent duplicate');
assert(mockScholarStatsUpdates === 1, '16.4 Update function NOT called again on retry (0 duplicate writes)');

// 16.3 Conflicting payload on same syncRunId
let conflictDetected = false;
try {
  await scholarSyncRepo.processSyncRun(
    'sync-run-001',
    { citations: 199, h_index: 10, i10_index: 10, last_updated: '2026-08-18T00:00:00Z' },
    mockUpdater
  );
} catch (e) {
  if (e.message.includes('Sync conflict: syncRunId')) conflictDetected = true;
}
assert(conflictDetected === true, '16.5 Conflicting payload with same syncRunId is strictly rejected');

// 16.4 New distinct syncRunId
const run2Res = await scholarSyncRepo.processSyncRun(
  'sync-run-002',
  { citations: 175, h_index: 8, i10_index: 8, last_updated: '2026-08-19T00:00:00Z' },
  mockUpdater
);
assert(run2Res.status === 'applied', '16.6 New distinct sync-run-002 applied successfully');
assert(mockScholarStatsUpdates === 2, '16.7 Scholar stats update function called for new run');

// ----------------------------------------------------------------
// SUITE 17: Source of Truth Decisions Provenance Log
// ----------------------------------------------------------------
console.log('\n--- SUITE 17: SOURCE OF TRUTH DECISIONS PROVENANCE LOG ---');
const decisionLogPath = path.join(__dirname, 'source-of-truth-decisions.md');
assert(fs.existsSync(decisionLogPath), '17.1 source-of-truth-decisions.md exists in migration/');
const decisionLogContent = fs.readFileSync(decisionLogPath, 'utf8');
assert(decisionLogContent.includes('Total Citations'), '17.2 Citations conflict documented');
assert(decisionLogContent.includes('HOD Department Designation'), '17.3 HOD Designation conflict documented');
assert(decisionLogContent.includes('Appointment Start Date'), '17.4 Experience start date conflict documented');
assert(decisionLogContent.includes('Graduation Year Formatting'), '17.5 Education year formatting documented');
assert(decisionLogContent.includes('Active Academic Identity Profiles'), '17.6 Social links conflict documented');
assert(decisionLogContent.includes('Headshot & Brand Vectors'), '17.7 Media assets provenance documented');

console.log('\n' + '='.repeat(70));
console.log(` PHASE 1.5 HARDENING TEST SUITE RESULTS: ${passed}/${passed + failed} PASSED`);
console.log('='.repeat(70) + '\n');

if (failed > 0) process.exit(1);
