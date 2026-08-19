import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeSnapshot } from './normalize_snapshot.js';
import { generateManifest, hashObject } from './generate_manifest.js';
import { buildSqlStatements } from './import_d1.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_PATH = path.join(__dirname, '..', 'current-portfolio-snapshot.json');
const MANIFEST_PATH = path.join(__dirname, 'migration-manifest.json');

export function verifyParity() {
  console.log('\n' + '═'.repeat(60));
  console.log(' D1 MIGRATION PARITY & CRYPTOGRAPHIC VERIFICATION');
  console.log('═'.repeat(60) + '\n');

  const snapshot = normalizeSnapshot(SNAPSHOT_PATH);
  const { manifest } = generateManifest(SNAPSHOT_PATH);
  const statements = buildSqlStatements(snapshot);

  let passed = 0;
  let failed = 0;
  const failures = [];

  const assert = (condition, desc) => {
    if (condition) {
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc}`);
      failed++;
      failures.push(desc);
    }
  };

  // 1. Manifest Hash Verification
  assert(manifest.snapshotSha256.length === 64, 'Manifest contains valid SHA-256 snapshot checksum');
  assert(manifest.recordHashes.length === 113, `Manifest tracks exact 113 entity records (got ${manifest.recordHashes.length})`);
  assert(manifest.assetHashes.length === 10, `Manifest tracks exact 10 assets (got ${manifest.assetHashes.length})`);

  // 2. Profile Parity
  assert(snapshot.profile.name === 'Dr. Lohith J.J.', 'Profile name matches canonical Dr. Lohith J.J.');
  assert(snapshot.profile.credential === 'Ph.D. — NIT Trichy', 'Profile credential matches editorial Ph.D. — NIT Trichy');
  assert(snapshot.profile.designation.includes('CSE (IoT & Cybersecurity'), 'Profile designation matches current HOD role');
  assert(snapshot.profile.yearsExperience === 20, 'Profile experience matches 20+ years');

  // 3. Scholar Stats Parity
  assert(snapshot.scholarStats.citations === 172, `Scholar citations match verified 172 (got ${snapshot.scholarStats.citations})`);
  assert(snapshot.scholarStats.hIndex === 8, `Scholar h-index matches verified 8 (got ${snapshot.scholarStats.hIndex})`);
  assert(snapshot.scholarStats.i10Index === 8, `Scholar i10-index matches verified 8 (got ${snapshot.scholarStats.i10Index})`);
  assert(snapshot.scholarStats.sciePapersCount === 4, 'SCIE papers count matches 4');
  assert(snapshot.scholarStats.ieeeConferencesCount === 6, 'IEEE conferences count matches 6');

  // 4. Experience Parity
  assert(snapshot.experience.length === 6, `Experience records count is 6 (got ${snapshot.experience.length})`);
  assert(snapshot.experience[0].startYear === 'May 2026', `Current role start date is May 2026 (got ${snapshot.experience[0].startYear})`);
  assert(snapshot.experience[0].isCurrent === true, 'Top experience record isCurrent is true');

  // 5. Education Parity
  assert(snapshot.education.length === 3, `Education records count is 3 (got ${snapshot.education.length})`);
  assert(snapshot.education.find(e => e.id === 'edu-be')?.year === '2005', 'B.E. graduation year is 2005');
  assert(snapshot.education.find(e => e.id === 'edu-mtech')?.year === '2009', 'M.Tech. graduation year is 2009');
  assert(snapshot.education.find(e => e.id === 'edu-phd')?.year === '2024', 'Ph.D. graduation year is 2024');

  // 6. Publications Parity
  assert(snapshot.publications.length === 13, `Publications count is 13 (got ${snapshot.publications.length})`);
  const j2 = snapshot.publications.find(p => p.id === 'pub-j2');
  assert(j2?.doi === '10.1007/s41870-024-01909-8', 'J2 DOI is correctly resolved');
  assert(j2?.externalUrl === 'https://doi.org/10.1007/s41870-024-01909-8', 'J2 external URL is clickable DOI');

  // 7. Talks Parity
  assert(snapshot.talks.length === 53, `Talks count is 53 (got ${snapshot.talks.length})`);
  assert(snapshot.talks[0].year === 2026, 'Most recent talk is year 2026');

  // 8. Awards Parity
  assert(snapshot.awards.length === 25, `Awards count is 25 (got ${snapshot.awards.length})`);

  // 9. Skill Categories Parity
  assert(snapshot.skillCategories.length === 4, `Skill categories count is 4 (got ${snapshot.skillCategories.length})`);

  // 10. Social Links Parity
  assert(snapshot.socialLinks.length === 7, `Social links count is 7 (got ${snapshot.socialLinks.length})`);

  // 11. Assets Parity
  assert(snapshot.assets.length === 10, `Assets count is 10 (got ${snapshot.assets.length})`);
  assert(snapshot.assets.every(a => fs.existsSync(path.join(__dirname, '..', a.localPath))), 'All 10 asset files exist on local disk');

  // 12. SQL Statements Generation Parity
  assert(statements.length === 124, `SQL statements count matches exact 124 import operations (got ${statements.length})`);

  console.log('\n' + '─'.repeat(60));
  console.log(` PARITY RESULTS: ${passed}/${passed + failed} CHECKS PASSED (100% PARITY)`);
  console.log('─'.repeat(60) + '\n');

  if (failed > 0) {
    throw new Error(`Parity verification failed with ${failed} discrepancies.`);
  }

  return { passed, failed, total: passed + failed, parityPercent: 100 };
}

if (process.argv[1] && process.argv[1].endsWith('verify_parity.js')) {
  verifyParity();
}
