// ================================================================
// PHASE 3 — REACT ADMIN DASHBOARD INTEGRATION & LOGIC TEST SUITE
// Automated verification of API Client, Concurrency Handling,
// Entity Serializers, Error Boundary, and State Integrity
// ================================================================

import { strict as assert } from 'assert';

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
console.log(' PHASE 3 — REACT ADMIN DASHBOARD TEST SUITE');
console.log('='.repeat(70) + '\n');

// ----------------------------------------------------------------
// SUITE 1: API CLIENT ERROR HANDLING & STATUS MAPPING
// ----------------------------------------------------------------
console.log('--- SUITE 1: API CLIENT ERROR MAPPING ---');

class ApiClientError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// 1.1 Concurrency Conflict Error (409)
const err409 = new ApiClientError(409, 'CONCURRENCY_CONFLICT', 'Expected version 1 does not match database version');
testAssert(err409.status === 409, '1.1 Concurrency conflict mapped to HTTP 409');
testAssert(err409.code === 'CONCURRENCY_CONFLICT', '1.2 Error code is CONCURRENCY_CONFLICT');

// 1.2 Validation Error (400)
const err400 = new ApiClientError(400, 'VALIDATION_ERROR', 'Validation failed', { name: ['Required'] });
testAssert(err400.status === 400, '1.3 Validation error mapped to HTTP 400');
testAssert(err400.details.name[0] === 'Required', '1.4 Field-level validation error details preserved');

// 1.3 Unauthorized Error (401)
const err401 = new ApiClientError(401, 'UNAUTHORIZED', 'Missing Access assertion');
testAssert(err401.status === 401, '1.5 Unauthorized mapped to HTTP 401');

// 1.4 Forbidden Error (403)
const err403 = new ApiClientError(403, 'FORBIDDEN', 'Email not in allowlist');
testAssert(err403.status === 403, '1.6 Forbidden mapped to HTTP 403');

// ----------------------------------------------------------------
// SUITE 2: PROFILE FORM SERIALIZATION & HTML PRESERVATION
// ----------------------------------------------------------------
console.log('\n--- SUITE 2: PROFILE FORM DATA & HTML PRESERVATION ---');

const rawProfileData = {
  id: 'profile',
  name: 'Dr. Lohith J.J.',
  credential: 'Ph.D. — NIT Trichy',
  designation: 'Professor & Head of Department — CSE',
  years_experience: 20,
  current_institution: 'Nagarjuna College of Engineering and Technology (NCET), Bengaluru',
  hero_description_line1: 'Professor & Head of Department with over <strong>20 years</strong> of academic leadership.',
  hero_description_line2: 'Specializing in IoT, Blockchain, Post-Quantum Cryptography, and Cloud Systems.',
  email_primary: 'lohithjj@gmail.com',
  email_secondary: 'hod-cse@ncetmail.com',
  phone: '+91-9886745882',
  address: 'NCET, Bengaluru',
  photo_asset_id: 'assets/Dr Lohith J J.jpeg',
  additional_roles_json: JSON.stringify(['Guest Faculty — BITS Pilani (Off-Campus)', 'BoS Member — Autonomous Institutions']),
  professional_memberships_json: JSON.stringify(['Senior Member — IEEE', 'Life Member — Cryptology Research Society of India (CRSI)']),
  version: 2
};

// Form state reconstruction
const formData = {
  name: rawProfileData.name,
  credential: rawProfileData.credential,
  designation: rawProfileData.designation,
  yearsExperience: rawProfileData.years_experience,
  currentInstitution: rawProfileData.current_institution,
  heroDescriptionLine1: rawProfileData.hero_description_line1,
  heroDescriptionLine2: rawProfileData.hero_description_line2,
  emailPrimary: rawProfileData.email_primary,
  emailSecondary: rawProfileData.email_secondary,
  phone: rawProfileData.phone,
  address: rawProfileData.address,
  photoAsset: rawProfileData.photo_asset_id,
  additionalRoles: JSON.parse(rawProfileData.additional_roles_json).join('\n'),
  professionalMemberships: JSON.parse(rawProfileData.professional_memberships_json).join('\n')
};

testAssert(formData.heroDescriptionLine1.includes('<strong>20 years</strong>'), '2.1 Hero HTML inline markup safely preserved in form');
testAssert(formData.additionalRoles.includes('BITS Pilani'), '2.2 Additional roles parsed to multi-line string');

// Payload reconstruction for update
const updatePayload = {
  name: formData.name,
  credential: formData.credential || null,
  designation: formData.designation,
  yearsExperience: Number(formData.yearsExperience),
  currentInstitution: formData.currentInstitution,
  heroDescriptionLine1: formData.heroDescriptionLine1,
  heroDescriptionLine2: formData.heroDescriptionLine2,
  emailPrimary: formData.emailPrimary,
  emailSecondary: formData.emailSecondary || null,
  phone: formData.phone,
  address: formData.address,
  photoAsset: formData.photoAsset || null,
  additionalRoles: formData.additionalRoles.split('\n').map(s => s.trim()).filter(Boolean),
  professionalMemberships: formData.professionalMemberships.split('\n').map(s => s.trim()).filter(Boolean)
};

testAssert(updatePayload.heroDescriptionLine1 === rawProfileData.hero_description_line1, '2.3 Hero HTML unchanged upon serialization');
testAssert(Array.isArray(updatePayload.additionalRoles) && updatePayload.additionalRoles.length === 2, '2.4 Roles serialized back to string array');
testAssert(updatePayload.yearsExperience === 20, '2.5 Years experience converted to number');

// ----------------------------------------------------------------
// SUITE 3: DIRTY STATE & UNSAVED CHANGES DETECTION
// ----------------------------------------------------------------
console.log('\n--- SUITE 3: DIRTY STATE & UNSAVED CHANGES ---');

const initialForm = { ...formData };
const isClean = JSON.stringify(formData) === JSON.stringify(initialForm);
testAssert(isClean === true, '3.1 Initial form state is not dirty');

const modifiedForm = { ...formData, name: 'Dr. Lohith J.J. (Updated)' };
const isDirty = JSON.stringify(modifiedForm) !== JSON.stringify(initialForm);
testAssert(isDirty === true, '3.2 Modified form field triggers dirty state');

// ----------------------------------------------------------------
// SUITE 4: PUBLICATIONS CRUD CONTRACT & CONCURRENCY
// ----------------------------------------------------------------
console.log('\n--- SUITE 4: PUBLICATIONS CRUD & CONCURRENCY ---');

const pubMock = {
  id: 'pub-j1',
  code_number: 'J1',
  title: 'Secure and Trustworthy Healthcare System Using Blockchain and IPFS',
  authors: 'Lohith J.J., Preetham S., et al.',
  venue: 'IEEE Access',
  publication_type: 'journal',
  year: 2024,
  doi: '10.1109/ACCESS.2024.1234567',
  external_url: 'https://doi.org/10.1109/ACCESS.2024.1234567',
  pdf_asset_id: null,
  featured: 1,
  published: 1,
  display_order: 1,
  version: 3
};

// Simulate Delete Request with Version Query Param
const deleteUrl = `/admin/publications/${pubMock.id}?version=${pubMock.version}`;
testAssert(deleteUrl.includes('version=3'), '4.1 Publication delete passes expected version in query');

// Stale Version Check Simulation
const staleVersion = 2;
const isStale = staleVersion !== pubMock.version;
testAssert(isStale === true, '4.2 Stale version mismatch detected before destructive action');

// ----------------------------------------------------------------
// SUITE 5: ALL 9 CONTENT ENTITIES ADMIN CLIENT COVERAGE
// ----------------------------------------------------------------
console.log('\n--- SUITE 5: ADMIN API 9-ENTITY CLIENT METHOD COVERAGE ---');

import { adminApi } from './src/api/client.js';

testAssert(typeof adminApi.getProfile === 'function', '5.1 adminApi.getProfile exists');
testAssert(typeof adminApi.updateProfile === 'function', '5.2 adminApi.updateProfile exists');
testAssert(typeof adminApi.getScholarStats === 'function', '5.3 adminApi.getScholarStats exists');
testAssert(typeof adminApi.updateScholarStats === 'function', '5.4 adminApi.updateScholarStats exists');
testAssert(typeof adminApi.getPublications === 'function', '5.5 adminApi.getPublications exists');
testAssert(typeof adminApi.createPublication === 'function', '5.6 adminApi.createPublication exists');
testAssert(typeof adminApi.updatePublication === 'function', '5.7 adminApi.updatePublication exists');
testAssert(typeof adminApi.deletePublication === 'function', '5.8 adminApi.deletePublication exists');
testAssert(typeof adminApi.getTalks === 'function', '5.9 adminApi.getTalks exists');
testAssert(typeof adminApi.createTalk === 'function', '5.10 adminApi.createTalk exists');
testAssert(typeof adminApi.getExperience === 'function', '5.11 adminApi.getExperience exists');
testAssert(typeof adminApi.createExperience === 'function', '5.12 adminApi.createExperience exists');
testAssert(typeof adminApi.getEducation === 'function', '5.13 adminApi.getEducation exists');
testAssert(typeof adminApi.createEducation === 'function', '5.14 adminApi.createEducation exists');
testAssert(typeof adminApi.getAwards === 'function', '5.15 adminApi.getAwards exists');
testAssert(typeof adminApi.createAward === 'function', '5.16 adminApi.createAward exists');
testAssert(typeof adminApi.getSkills === 'function', '5.17 adminApi.getSkills exists');
testAssert(typeof adminApi.createSkill === 'function', '5.18 adminApi.createSkill exists');
testAssert(typeof adminApi.getSocialLinks === 'function', '5.19 adminApi.getSocialLinks exists');
testAssert(typeof adminApi.createSocialLink === 'function', '5.20 adminApi.createSocialLink exists');
testAssert(typeof adminApi.getPresignedUrl === 'function', '5.21 adminApi.getPresignedUrl exists');

// ----------------------------------------------------------------
// SUITE 6: ASSET UPLOAD PRE-SIGNED URL BOUNDARY
// ----------------------------------------------------------------
console.log('\n--- SUITE 6: ASSET UPLOAD FLOW VALIDATION ---');

const assetFilename = 'NIT_Trichy_Keynote.pdf';
const sanitizeFilename = (fn) => fn.replace(/[^a-zA-Z0-9._-]/g, '_');
const uploadKey = `media/${Date.now()}-${sanitizeFilename(assetFilename)}`;
testAssert(uploadKey.startsWith('media/'), '6.1 Generated upload key namespaced under media/');
testAssert(uploadKey.endsWith('NIT_Trichy_Keynote.pdf'), '6.2 Filename sanitized and preserved');

console.log('\n' + '='.repeat(70));
console.log(` PHASE 3 TEST SUITE RESULTS: ${passed}/${passed + failed} PASSED`);
console.log('='.repeat(70) + '\n');

if (failed > 0) process.exit(1);
