// ================================================================
// DETERMINISTIC REMOTE D1 CANONICAL SEED RUNNER
// ================================================================

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { validateSnapshot } from './validate_snapshot.js';
import { normalizeSnapshot } from './normalize_snapshot.js';
import { buildSqlStatements } from './import_d1.js';

const ROOT_DIR = path.resolve('.');
const SNAPSHOT_PATH = path.join(ROOT_DIR, 'current-portfolio-snapshot.json');
const SEED_SQL_PATH = path.join(ROOT_DIR, 'migration', 'remote_seed.sql');

console.log('='.repeat(70));
console.log(' REMOTE D1 CANONICAL DATA SEED RUNNER');
console.log('='.repeat(70) + '\n');

// 1. Validate Snapshot
console.log('[1/4] Validating canonical snapshot...');
const val = validateSnapshot(SNAPSHOT_PATH);
if (!val.success) {
  console.error('❌ Snapshot validation failed.');
  process.exit(1);
}
console.log('  ✅ Canonical snapshot valid.');

// 2. Normalize and build statements
console.log('[2/4] Normalizing snapshot & building SQL statements...');
const snapshot = normalizeSnapshot(SNAPSHOT_PATH);
const statements = buildSqlStatements(snapshot);

// Dependency order: assets must be inserted before tables referencing them
const tableOrder = [
  'assets',
  'profile',
  'scholar_stats',
  'publications',
  'talks',
  'experience',
  'education',
  'awards',
  'skill_categories',
  'social_links',
  'revisions'
];

statements.sort((a, b) => {
  const indexA = tableOrder.indexOf(a.table);
  const indexB = tableOrder.indexOf(b.table);
  return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
});

console.log(`  ✅ Generated ${statements.length} SQL operations ordered by dependency.`);

// 3. Serialize SQL with SQLite literal escaping
console.log('[3/4] Generating formatted SQL script...');
function sqlEscape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  return `'${String(val).replace(/'/g, "''")}'`;
}

function formatSql(sql, params) {
  let paramIndex = 0;
  return sql.replace(/\?/g, () => {
    const val = params[paramIndex++];
    return sqlEscape(val);
  });
}

const sqlLines = [
  '-- Canonical Seed Script for Cloudflare D1',
  '-- Target: portfolio-db',
  'PRAGMA foreign_keys = OFF;\n'
];

for (const stmt of statements) {
  sqlLines.push(formatSql(stmt.sql, stmt.params));
}

sqlLines.push('\nPRAGMA foreign_keys = ON;');

fs.writeFileSync(SEED_SQL_PATH, sqlLines.join('\n\n'), 'utf-8');
console.log(`  ✅ SQL script written to ${SEED_SQL_PATH}`);

// 4. Apply SQL script to remote D1
console.log('[4/4] Executing batch import on remote Cloudflare D1 (portfolio-db)...');
try {
  const output = execSync(
    'node node_modules/wrangler/bin/wrangler.js d1 execute portfolio-db --remote --file migration/remote_seed.sql --json',
    { cwd: ROOT_DIR, encoding: 'utf-8' }
  );
  console.log('  ✅ Remote D1 execution successful!');
} catch (err) {
  console.error('❌ Error executing remote D1 seed:', err.message);
  if (err.stdout) console.log(err.stdout);
  if (err.stderr) console.error(err.stderr);
  process.exit(1);
}

console.log('\n' + '='.repeat(70));
console.log(' ✅ CANONICAL SEED APPLIED TO REMOTE D1');
console.log('='.repeat(70) + '\n');
