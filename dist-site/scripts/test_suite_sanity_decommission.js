// ================================================================
// SANITY DECOMMISSION VERIFICATION TEST SUITE
// Asserts ZERO runtime, build-time, or configuration dependencies on Sanity CMS.
// ================================================================

import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.resolve('.');

console.log('\n' + '='.repeat(70));
console.log(' SANITY CMS DECOMMISSIONING VERIFICATION SUITE');
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

function scanDirForPatterns(dir, patterns, ignoreDirs = ['.git', 'node_modules', 'dist-site', 'dist-admin', 'data/archive']) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');

    if (ignoreDirs.some(ign => relPath.startsWith(ign) || entry.name === ign)) {
      continue;
    }

    if (entry.isDirectory()) {
      results.push(...scanDirForPatterns(fullPath, patterns, ignoreDirs));
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts') || entry.name.endsWith('.html') || entry.name.endsWith('.py') || entry.name.endsWith('.yml') || entry.name.endsWith('.toml') || entry.name.endsWith('.json'))) {
      if (entry.name === 'test_suite_sanity_decommission.js' || entry.name === 'test_suite_phase6.js' || entry.name === 'export_final_archives.js' || entry.name === 'initial_sanity_data.ndjson') {
        continue; // skip this test file, historical phase6 test suite, historical archive export script, and legacy archive file
      }
      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          results.push({ file: relPath, pattern: String(pattern) });
        }
      }
    }
  }
  return results;
}

// ----------------------------------------------------------------
// SUITE 1: DIRECTORY & FILE DECOMMISSIONING
// ----------------------------------------------------------------
console.log('--- SUITE 1: DIRECTORY & FILE DECOMMISSIONING ---');

assert(!fs.existsSync(path.join(ROOT_DIR, 'studio')), '1.1 studio/ directory completely removed');
assert(!fs.existsSync(path.join(ROOT_DIR, 'scripts', 'sanity')), '1.2 scripts/sanity/ directory completely removed');
assert(!fs.existsSync(path.join(ROOT_DIR, 'scratch_sanity_dump.json')), '1.3 scratch_sanity_dump.json removed');

// ----------------------------------------------------------------
// SUITE 2: REPOSITORY-WIDE RUNTIME SANITY SCAN
// ----------------------------------------------------------------
console.log('\n--- SUITE 2: REPOSITORY-WIDE RUNTIME SANITY SCAN ---');

const sanityPatterns = [
  /@sanity/,
  /sanity\.io/,
  /api\.sanity\.io/,
  /cdn\.sanity\.io/,
  /SANITY_PROJECT_ID/,
  /SANITY_WRITE_TOKEN/,
  /SANITY_DATASET/,
  /createClient\s*\(/
];

// Scan worker/
const workerMatches = scanDirForPatterns(path.join(ROOT_DIR, 'worker'), sanityPatterns);
assert(workerMatches.length === 0, `2.1 Worker directory has 0 Sanity references (Found: ${workerMatches.length})`);

// Scan admin/
const adminMatches = scanDirForPatterns(path.join(ROOT_DIR, 'admin'), sanityPatterns);
assert(adminMatches.length === 0, `2.2 Admin SPA directory has 0 Sanity references (Found: ${adminMatches.length})`);

// Scan scripts/
const scriptsMatches = scanDirForPatterns(path.join(ROOT_DIR, 'scripts'), sanityPatterns);
if (scriptsMatches.length > 0) {
  console.log('    [DEBUG] scriptsMatches:', scriptsMatches);
}
assert(scriptsMatches.length === 0, `2.3 Scripts directory has 0 Sanity references (Found: ${scriptsMatches.length})`);

// Scan .github/
const githubMatches = scanDirForPatterns(path.join(ROOT_DIR, '.github'), sanityPatterns);
assert(githubMatches.length === 0, `.github workflows have 0 Sanity references (Found: ${githubMatches.length})`);

// Scan index.html
const indexHtmlContent = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf-8');
const indexHtmlMatches = sanityPatterns.some(p => p.test(indexHtmlContent));
assert(!indexHtmlMatches, '2.5 index.html has 0 Sanity references');

// ----------------------------------------------------------------
// SUITE 3: DEPENDENCY AUDIT
// ----------------------------------------------------------------
console.log('\n--- SUITE 3: DEPENDENCY AUDIT ---');

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8'));
const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
const sanityDeps = Object.keys(allDeps).filter(dep => dep.includes('sanity'));
assert(sanityDeps.length === 0, '3.1 Root package.json has 0 Sanity dependencies');

const wranglerContent = fs.readFileSync(path.join(ROOT_DIR, 'wrangler.toml'), 'utf-8');
assert(!wranglerContent.includes('SANITY_'), '3.2 wrangler.toml contains 0 SANITY_* variables');

// ----------------------------------------------------------------
// SUITE 4: ARCHIVE BACKUP SAFETY
// ----------------------------------------------------------------
console.log('\n--- SUITE 4: ARCHIVE BACKUP SAFETY ---');

const sanityArchive = path.join(ROOT_DIR, 'data', 'archive', 'sanity_final_archive.json');
assert(fs.existsSync(sanityArchive), '4.1 data/archive/sanity_final_archive.json exists as immutable historical backup');
if (fs.existsSync(sanityArchive)) {
  const archiveJson = JSON.parse(fs.readFileSync(sanityArchive, 'utf-8'));
  assert(archiveJson.projectId === '12ok6v8i', '4.2 Historical archive preserves legacy projectId 12ok6v8i');
  assert(archiveJson.totalDocuments === 108, '4.3 Historical archive preserves all 108 legacy documents');
}

// ----------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------
console.log('\n' + '='.repeat(70));
console.log(` SANITY DECOMMISSION VERIFICATION SUITE: ${passed} PASSED, ${failed} FAILED`);
console.log('='.repeat(70) + '\n');

if (failed > 0) {
  process.exit(1);
}
