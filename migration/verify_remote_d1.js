// ================================================================
// REMOTE D1 CANONICAL DATA PARITY AUDIT
// Executes live SELECT COUNT(*) queries on remote Cloudflare D1
// ================================================================

import { execSync } from 'child_process';

console.log('='.repeat(70));
console.log(' REMOTE CLOUDFLARE D1 DATA PARITY AUDIT (portfolio-db)');
console.log('='.repeat(70) + '\n');

const tables = [
  'profile',
  'scholar_stats',
  'publications',
  'talks',
  'experience',
  'education',
  'awards',
  'skill_categories',
  'social_links',
  'assets',
  'revisions'
];

const expected = {
  profile: 1,
  scholar_stats: 1,
  publications: 13,
  talks: 53,
  experience: 6,
  education: 3,
  awards: 25,
  skill_categories: 4,
  social_links: 7,
  assets: 10,
  revisions: 1
};

console.log('--- TABLE RECORD COUNTS (REMOTE D1) ---');
let allMatch = true;

for (const tbl of tables) {
  const cmd = `node node_modules/wrangler/bin/wrangler.js d1 execute portfolio-db --remote --command "SELECT count(*) as count FROM ${tbl};" --json`;
  const output = execSync(cmd, { encoding: 'utf-8' });
  const parsed = JSON.parse(output);
  const count = parsed[0].results[0].count;
  const exp = expected[tbl];
  const match = count === exp;
  if (!match) allMatch = false;
  console.log(`  ${match ? '✅' : '❌'} ${tbl.padEnd(20)}: ${count} (Expected: ${exp})`);
}

// Check Scholar Stats values
const scholarCmd = `node node_modules/wrangler/bin/wrangler.js d1 execute portfolio-db --remote --command "SELECT citations, h_index, i10_index, scie_papers_count, ieee_conferences_count FROM scholar_stats WHERE id='scholarStats';" --json`;
const scholarOutput = execSync(scholarCmd, { encoding: 'utf-8' });
const scholarStats = JSON.parse(scholarOutput)[0].results[0];

console.log('\n--- SCHOLAR METRICS (REMOTE D1) ---');
console.log(`  • Citations:           ${scholarStats.citations} (Expected: 172) -> ${scholarStats.citations === 172 ? '✅' : '❌'}`);
console.log(`  • h-index:             ${scholarStats.h_index} (Expected: 8)   -> ${scholarStats.h_index === 8 ? '✅' : '❌'}`);
console.log(`  • i10-index:           ${scholarStats.i10_index} (Expected: 8)   -> ${scholarStats.i10_index === 8 ? '✅' : '❌'}`);
console.log(`  • SCIE Papers:         ${scholarStats.scie_papers_count} (Expected: 4)   -> ${scholarStats.scie_papers_count === 4 ? '✅' : '❌'}`);
console.log(`  • IEEE Conferences:    ${scholarStats.ieee_conferences_count} (Expected: 6)   -> ${scholarStats.ieee_conferences_count === 6 ? '✅' : '❌'}`);

if (allMatch && scholarStats.citations === 172 && scholarStats.h_index === 8 && scholarStats.i10_index === 8) {
  console.log('\n' + '='.repeat(70));
  console.log(' ✅ 100% REMOTE D1 PARITY VERIFIED');
  console.log('='.repeat(70) + '\n');
} else {
  console.error('\n❌ Discrepancy detected in remote D1 data.');
  process.exit(1);
}
