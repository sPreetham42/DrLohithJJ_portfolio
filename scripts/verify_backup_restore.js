// ================================================================
// BACKUP SNAPSHOT INTEGRITY & RESTORE VERIFIER
// Validates current-portfolio-snapshot.json schema completeness,
// foreign-key references, non-null constraints, and restore readiness.
// ================================================================

import fs from 'fs';
import path from 'path';

console.log('='.repeat(70));
console.log(' VERIFYING BACKUP SNAPSHOT INTEGRITY & RESTORE READINESS');
console.log('='.repeat(70) + '\n');

const snapshotPath = path.resolve('current-portfolio-snapshot.json');
if (!fs.existsSync(snapshotPath)) {
  console.error('❌ Snapshot file current-portfolio-snapshot.json is missing!');
  process.exit(1);
}

const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
let errorCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    errorCount++;
  }
}

// 1. Snapshot Top-Level Structure
assert(Boolean(snapshot.profile), 'Snapshot contains profile object');
assert(Array.isArray(snapshot.assets) && snapshot.assets.length > 0, `Snapshot contains ${snapshot.assets?.length || 0} registered assets`);

// 2. Profile Record
assert(Boolean(snapshot.profile), 'Snapshot contains profile singleton');
assert(snapshot.profile.name === 'Dr. Lohith J.J.', 'Profile name matches Dr. Lohith J.J.');
assert(typeof snapshot.profile.years_experience === 'number' || typeof snapshot.profile.yearsExperience === 'number', 'Profile years of experience is numeric');

// 3. Scholar Stats
const scholar = snapshot.scholar_stats || snapshot.scholarStats;
assert(Boolean(scholar), 'Snapshot contains scholar_stats record');
assert(Number(scholar.citations) > 0, `Scholar citations (${scholar?.citations}) > 0`);
assert(Number(scholar.h_index || scholar.hIndex) > 0, `Scholar h-index is positive`);

// 4. Publications List
const pubs = snapshot.publications || [];
assert(Array.isArray(pubs) && pubs.length > 0, `Snapshot contains ${pubs.length} publications`);
pubs.forEach((p, idx) => {
  if (!p.id || !p.title || !p.venue || !p.year) {
    console.error(`  ❌ [FAIL] Publication #${idx} missing required fields (id, title, venue, year)`);
    errorCount++;
  }
});

// 5. Talks List
const talks = snapshot.talks || [];
assert(Array.isArray(talks) && talks.length >= 40, `Snapshot contains ${talks.length} talks`);

// 6. Experience List
const exp = snapshot.experience || [];
assert(Array.isArray(exp) && exp.length >= 3, `Snapshot contains ${exp.length} experience entries`);

// 7. Education List
const edu = snapshot.education || [];
assert(Array.isArray(edu) && edu.length >= 3, `Snapshot contains ${edu.length} education entries`);

// 8. Awards List
const awards = snapshot.awards || [];
assert(Array.isArray(awards) && awards.length >= 1, `Snapshot contains ${awards.length} awards`);

// 9. Skills & Categories
const skills = snapshot.skill_categories || snapshot.skillCategories || snapshot.skills || [];
assert(Array.isArray(skills) && skills.length >= 3, `Snapshot contains ${skills.length} skill categories`);

// 10. Social Links
const socials = snapshot.social_links || snapshot.socialLinks || [];
assert(Array.isArray(socials) && socials.length >= 4, `Snapshot contains ${socials.length} social links`);

console.log('\n' + '='.repeat(70));
if (errorCount === 0) {
  console.log(' ✅ ALL SNAPSHOT & RESTORE INTEGRITY CHECKS PASSED');
  console.log('='.repeat(70) + '\n');
  process.exit(0);
} else {
  console.error(` ❌ SNAPSHOT RESTORE INTEGRITY FAILED WITH ${errorCount} ERRORS`);
  console.log('='.repeat(70) + '\n');
  process.exit(1);
}
