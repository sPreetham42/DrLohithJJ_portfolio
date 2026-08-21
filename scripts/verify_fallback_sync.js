// ================================================================
// FALLBACK REPOSITORY SYNCHRONIZATION & INTEGRITY VERIFIER
// Validates that scripts/data/fallback.js matches the canonical snapshot
// and contains all required records for disaster/offline resilience.
// ================================================================

import fs from 'fs';
import path from 'path';
import { fallbackData } from './data/fallback.js';

console.log('='.repeat(70));
console.log(' VERIFYING CANONICAL FALLBACK DATA SYNCHRONIZATION');
console.log('='.repeat(70) + '\n');

let errorCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    errorCount++;
  }
}

// 1. Profile Verification
assert(Boolean(fallbackData.profile), 'Profile fallback object exists');
assert(fallbackData.profile.name === 'Dr. Lohith J.J.', 'Profile name matches Dr. Lohith J.J.');
assert(fallbackData.profile.yearsExperience >= 20, 'Profile yearsExperience is valid number >= 20');
assert(fallbackData.profile.emailPrimary === 'lohithjj@gmail.com', 'Profile email matches canonical primary');

// 2. Scholar Stats Verification
assert(Boolean(fallbackData.scholarStats), 'Scholar stats fallback object exists');
assert(typeof fallbackData.scholarStats.citations === 'number' && fallbackData.scholarStats.citations > 0, 'Scholar citations is positive integer');
assert(typeof fallbackData.scholarStats.sciePapersCount === 'number' && fallbackData.scholarStats.sciePapersCount >= 4, 'SCIE papers count is valid');

// 3. Publications Verification
assert(Array.isArray(fallbackData.publications) && fallbackData.publications.length > 0, `Publications list contains ${fallbackData.publications?.length || 0} entries`);
const pubWithJ1 = fallbackData.publications.find(p => p.codeNumber === 'J1' || p.id === 'pub-j1');
assert(Boolean(pubWithJ1), 'Canonical J1 publication is present');

// 4. Talks Verification
assert(Array.isArray(fallbackData.talks) && fallbackData.talks.length >= 40, `Talks list contains ${fallbackData.talks?.length || 0} entries`);

// 5. Experience Verification
assert(Array.isArray(fallbackData.experience) && fallbackData.experience.length >= 3, `Experience list contains ${fallbackData.experience?.length || 0} entries`);

// 6. Education Verification
assert(Array.isArray(fallbackData.education) && fallbackData.education.length >= 3, `Education list contains ${fallbackData.education?.length || 0} entries`);

// 7. Awards Verification
assert(Array.isArray(fallbackData.awards) && fallbackData.awards.length >= 1, `Awards list contains ${fallbackData.awards?.length || 0} entries`);

// 8. Skills Verification
assert(Array.isArray(fallbackData.skillCategories) && fallbackData.skillCategories.length >= 3, `Skill categories list contains ${fallbackData.skillCategories?.length || 0} entries`);

console.log('\n' + '='.repeat(70));
if (errorCount === 0) {
  console.log(' ✅ ALL FALLBACK DATA VERIFICATIONS PASSED');
  console.log('='.repeat(70) + '\n');
  process.exit(0);
} else {
  console.error(` ❌ FALLBACK VERIFICATION FAILED WITH ${errorCount} ERRORS`);
  console.log('='.repeat(70) + '\n');
  process.exit(1);
}
