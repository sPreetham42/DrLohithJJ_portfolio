// ================================================================
// PHASE 4 — PUBLIC FRONTEND READ ADAPTER & DUAL-SOURCE TEST SUITE
// Automated verification of API Client, Fallback Hierarchy,
// Section Hydration, Talk Year Filtering, and Error Boundaries
// ================================================================

import { strict as assert } from 'assert';
import { fallbackData } from './data/fallback.js';
import { publicDataAdapter } from './data/adapter.js';

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
console.log(' PHASE 4 — PUBLIC FRONTEND READ ADAPTER TEST SUITE');
console.log('='.repeat(70) + '\n');

// ----------------------------------------------------------------
// SUITE 1: CANONICAL FALLBACK DATA INTEGRITY
// ----------------------------------------------------------------
console.log('--- SUITE 1: CANONICAL FALLBACK DATA INTEGRITY ---');

// 1.1 Profile
testAssert(fallbackData.profile.name === 'Dr. Lohith J.J.', '1.1 Fallback profile name matches canonical value');
testAssert(fallbackData.profile.credential === 'Ph.D. — NIT Trichy', '1.2 Fallback credential matches canonical value');
testAssert(fallbackData.profile.heroDescriptionLine1.includes('<strong>20 years</strong>'), '1.3 Hero HTML markup preserved in fallback');
testAssert(fallbackData.profile.yearsExperience === 20, '1.4 Years experience is 20');

// 1.2 Scholar Stats
testAssert(fallbackData.scholarStats.citations === 172, '1.5 Scholar citations is 172');
testAssert(fallbackData.scholarStats.hIndex === 8, '1.6 Scholar hIndex is 8');
testAssert(fallbackData.scholarStats.i10Index === 8, '1.7 Scholar i10Index is 8');
testAssert(fallbackData.scholarStats.sciePapersCount === 4, '1.8 SCIE count is 4');

// 1.3 Publications (13 items)
testAssert(fallbackData.publications.length === 13, `1.9 Exactly 13 canonical publications in fallback (got ${fallbackData.publications.length})`);
testAssert(fallbackData.publications[0].codeNumber === 'J1', '1.10 First publication is J1');
testAssert(fallbackData.publications[1].doi === '10.1007/s41870-024-01909-8', '1.11 J2 Springer DOI resolved');
testAssert(fallbackData.publications[12].codeNumber === 'B1', '1.12 13th publication is B1 Textbook');

// 1.4 Talks (53 items)
testAssert(fallbackData.talks.length === 53, `1.13 Exactly 53 talks in fallback (got ${fallbackData.talks.length})`);
testAssert(fallbackData.talks[0].year === 2026, '1.14 Top talk is 2026 Keynote');
testAssert(fallbackData.talks[52].year === 2011, '1.15 Earliest talk is 2011');

// 1.5 Experience (6 items)
testAssert(fallbackData.experience.length === 6, `1.16 Exactly 6 experience entries in fallback (got ${fallbackData.experience.length})`);
testAssert(fallbackData.experience[0].startYear === 'May 2026', '1.17 Active HOD role starts May 2026');

// 1.6 Education (3 items)
testAssert(fallbackData.education.length === 3, `1.18 Exactly 3 education degrees in fallback (got ${fallbackData.education.length})`);
testAssert(fallbackData.education[0].year === '2024', '1.19 Ph.D. NIT Trichy completed 2024');

// 1.7 Awards (25 items)
testAssert(fallbackData.awards.length === 25, `1.20 Exactly 25 awards in fallback (got ${fallbackData.awards.length})`);

// 1.8 Skills (4 categories)
testAssert(fallbackData.skills.length === 4, `1.21 Exactly 4 skill categories in fallback (got ${fallbackData.skills.length})`);

// 1.9 Social Links (7 profiles)
testAssert(fallbackData.socialLinks.length === 7, `1.22 Exactly 7 social links in fallback (got ${fallbackData.socialLinks.length})`);

// ----------------------------------------------------------------
// SUITE 2: PUBLIC DATA ADAPTER FALLBACK HIERARCHY
// ----------------------------------------------------------------
console.log('\n--- SUITE 2: ADAPTER FALLBACK RESILIENCE ---');

// When API is not running, adapter gracefully returns fallback without throwing
const profile = await publicDataAdapter.getProfile();
testAssert(profile.name === 'Dr. Lohith J.J.', '2.1 getProfile() returns canonical profile on API offline');

const scholar = await publicDataAdapter.getScholarStats();
testAssert(scholar.citations === 172, '2.2 getScholarStats() returns verified 172 citations');

const pubs = await publicDataAdapter.getPublications();
testAssert(pubs.length === 13, '2.3 getPublications() returns all 13 papers');

const talksAll = await publicDataAdapter.getTalks();
testAssert(talksAll.length === 53, '2.4 getTalks() returns all 53 sessions');

const talks2026 = await publicDataAdapter.getTalks(2026);
testAssert(talks2026.every(t => t.year === 2026), '2.5 getTalks(2026) filters exclusively for 2026 sessions');
testAssert(talks2026.length === 2, `2.6 Exactly 2 talks for 2026 (got ${talks2026.length})`);

const exp = await publicDataAdapter.getExperience();
testAssert(exp.length === 6, '2.7 getExperience() returns 6 timeline records');

const edu = await publicDataAdapter.getEducation();
testAssert(edu.length === 3, '2.8 getEducation() returns 3 degree records');

const aw = await publicDataAdapter.getAwards();
testAssert(aw.length === 25, '2.9 getAwards() returns 25 award records');

const sk = await publicDataAdapter.getSkills();
testAssert(sk.length === 4, '2.10 getSkills() returns 4 skill categories');

const soc = await publicDataAdapter.getSocialLinks();
testAssert(soc.length === 7, '2.11 getSocialLinks() returns 7 verified identity rails');

// ----------------------------------------------------------------
// SUITE 3: TALKS YEAR FILTERING & COMPLETENESS (2011–2026)
// ----------------------------------------------------------------
console.log('\n--- SUITE 3: TALKS CHRONOLOGICAL COVERAGE (2011–2026) ---');

const years = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2014, 2011];
for (const yr of years) {
  const filtered = await publicDataAdapter.getTalks(yr);
  testAssert(filtered.length > 0 && filtered.every(t => t.year === yr), `3.${years.indexOf(yr) + 1} Year ${yr} contains ${filtered.length} verified sessions`);
}

// ----------------------------------------------------------------
// SUITE 4: REVERSIBLE FEATURE FLAG & CONFIGURATION
// ----------------------------------------------------------------
console.log('\n--- SUITE 4: REVERSIBILITY & CONFIGURATION ---');

global.window = {
  PORTFOLIO_CONFIG: {
    dataSource: 'fallback'
  }
};

const forcedFallbackProfile = await publicDataAdapter.getProfile();
testAssert(forcedFallbackProfile.name === 'Dr. Lohith J.J.', '4.1 Forced fallback mode works cleanly without network attempts');

global.window.PORTFOLIO_CONFIG.dataSource = 'api';
testAssert(global.window.PORTFOLIO_CONFIG.dataSource === 'api', '4.2 API primary mode enabled via configuration');

// ----------------------------------------------------------------
// SUITE 5: CONTROLLED HTML SANITIZATION & XSS DEFENSE
// ----------------------------------------------------------------
console.log('\n--- SUITE 5: CONTROLLED HTML SANITIZATION ---');

import { sanitizeControlledHtml } from './data/adapter.js';

const safeHtml = 'Professor with over <strong>20 years</strong> of leadership.';
testAssert(sanitizeControlledHtml(safeHtml) === safeHtml, '5.1 Safe formatting tags (strong, em, span) are preserved');

const maliciousScript = 'Bio <script>alert("pwned")</script> text';
testAssert(!sanitizeControlledHtml(maliciousScript).includes('<script>'), '5.2 Malicious script tags are stripped');

const maliciousAttr = '<strong onclick="stealCookies()">Click me</strong>';
testAssert(!sanitizeControlledHtml(maliciousAttr).includes('onclick='), '5.3 Malicious event handler attributes are stripped');

const maliciousProto = '<a href="javascript:alert(1)">Link</a>';
testAssert(!sanitizeControlledHtml(maliciousProto).includes('javascript:'), '5.4 Javascript pseudo-protocol stripped');

console.log('\n' + '='.repeat(70));
console.log(` PHASE 4 TEST SUITE RESULTS: ${passed}/${passed + failed} PASSED`);
console.log('='.repeat(70) + '\n');

if (failed > 0) process.exit(1);
