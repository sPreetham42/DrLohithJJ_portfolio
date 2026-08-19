import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import worker from './index.js';
import { normalizeSnapshot } from '../migration/normalize_snapshot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_PATH = path.join(__dirname, '..', 'current-portfolio-snapshot.json');

console.log('\n' + '='.repeat(70));
console.log(' PHASE 2 — WORKER API, SECURITY BOUNDARY & DATA ACCESS TEST SUITE');
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
// SETUP: IN-MEMORY DATABASE & REPOSITORIES WITH CANONICAL SEED
// ----------------------------------------------------------------
const snapshot = normalizeSnapshot(SNAPSHOT_PATH);

// In-Memory D1 Mock Store
const dbStore = {
  profile: {
    ...snapshot.profile,
    years_experience: snapshot.profile.yearsExperience,
    current_institution: snapshot.profile.currentInstitution,
    hero_description_line1: snapshot.profile.heroDescriptionLine1,
    hero_description_line2: snapshot.profile.heroDescriptionLine2,
    email_primary: snapshot.profile.emailPrimary,
    email_secondary: snapshot.profile.emailSecondary,
    photo_asset_id: snapshot.profile.photoAsset,
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
  publications: new Map(snapshot.publications.map(p => [p.id, {
    id: p.id,
    code_number: p.codeNumber,
    title: p.title,
    authors: p.authors,
    venue: p.venue,
    publication_type: p.publicationType,
    year: p.year,
    doi: p.doi,
    external_url: p.externalUrl,
    pdf_asset_id: null,
    featured: p.featured ? 1 : 0,
    published: 1,
    display_order: p.order,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: null
  }])),
  talks: new Map(snapshot.talks.map(t => [t.id, {
    id: t.id,
    title: t.title,
    venue: t.venue,
    date_string: t.dateString,
    year: t.year,
    featured: t.featured ? 1 : 0,
    published: 1,
    display_order: t.order,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: null
  }])),
  experience: new Map(snapshot.experience.map(e => [e.id, {
    id: e.id,
    role: e.role,
    organization: e.organization,
    start_year: e.startYear,
    end_year: e.endYear,
    is_current: e.isCurrent ? 1 : 0,
    published: 1,
    display_order: e.order,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: null
  }])),
  education: new Map(snapshot.education.map(e => [e.id, {
    id: e.id,
    degree: e.degree,
    institution: e.institution,
    year: e.year,
    thesis: e.thesis,
    published: 1,
    display_order: e.order,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: null
  }])),
  awards: new Map(snapshot.awards.map(a => [a.id, {
    id: a.id,
    title: a.title,
    organization: a.organization,
    year: a.year,
    description: a.description,
    certificate_asset_id: null,
    published: 1,
    display_order: a.order,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: null
  }])),
  skill_categories: new Map(snapshot.skillCategories.map(s => [s.id, {
    id: s.id,
    category: s.category,
    skills_json: JSON.stringify(s.skills),
    published: 1,
    display_order: s.order,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: null
  }])),
  social_links: new Map(snapshot.socialLinks.map(s => [s.id, {
    id: s.id,
    platform: s.platform,
    url: s.url,
    icon: s.icon,
    display_order: s.order,
    visible: s.visible ? 1 : 0,
    published: 1,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: null
  }])),
  scholar_sync_runs: new Map(),
  revisions: []
};

// D1 Mock Driver helper
function createStatementExecutor(sql, params = []) {
  return {
    bind: (...newParams) => createStatementExecutor(sql, newParams),
    first: async () => {
      if (sql.includes('FROM profile')) return dbStore.profile;
      if (sql.includes('FROM scholar_stats')) return dbStore.scholar_stats;
      if (sql.includes('FROM publications WHERE id =')) return dbStore.publications.get(params[0]) || null;
      if (sql.includes('FROM talks WHERE id =')) return dbStore.talks.get(params[0]) || null;
      if (sql.includes('FROM experience WHERE id =')) return dbStore.experience.get(params[0]) || null;
      if (sql.includes('FROM education WHERE id =')) return dbStore.education.get(params[0]) || null;
      if (sql.includes('FROM awards WHERE id =')) return dbStore.awards.get(params[0]) || null;
      if (sql.includes('FROM skill_categories WHERE id =')) return dbStore.skill_categories.get(params[0]) || null;
      if (sql.includes('FROM social_links WHERE id =')) return dbStore.social_links.get(params[0]) || null;
      if (sql.includes('FROM scholar_sync_runs WHERE sync_run_id =')) return dbStore.scholar_sync_runs.get(params[0]) || null;
      return null;
    },
    all: async () => {
      if (sql.includes('FROM publications')) {
        const list = Array.from(dbStore.publications.values()).filter(p => p.published === 1);
        list.sort((a, b) => a.display_order - b.display_order || b.year - a.year);
        return { results: list };
      }
      if (sql.includes('FROM talks')) {
        const list = Array.from(dbStore.talks.values()).filter(t => t.published === 1);
        list.sort((a, b) => b.year - a.year || a.display_order - b.display_order);
        return { results: list };
      }
      if (sql.includes('FROM experience')) {
        const list = Array.from(dbStore.experience.values()).filter(e => e.published === 1);
        list.sort((a, b) => a.display_order - b.display_order);
        return { results: list };
      }
      if (sql.includes('FROM education')) {
        const list = Array.from(dbStore.education.values()).filter(e => e.published === 1);
        list.sort((a, b) => a.display_order - b.display_order);
        return { results: list };
      }
      if (sql.includes('FROM awards')) {
        const list = Array.from(dbStore.awards.values()).filter(a => a.published === 1);
        list.sort((a, b) => a.display_order - b.display_order);
        return { results: list };
      }
      if (sql.includes('FROM skill_categories')) {
        const list = Array.from(dbStore.skill_categories.values()).filter(s => s.published === 1);
        list.sort((a, b) => a.display_order - b.display_order);
        return { results: list };
      }
      if (sql.includes('FROM social_links')) {
        const list = Array.from(dbStore.social_links.values()).filter(s => s.published === 1 && s.visible === 1);
        list.sort((a, b) => a.display_order - b.display_order);
        return { results: list };
      }
      return { results: [] };
    },
    run: async () => {
      if (sql.includes('UPDATE profile SET')) {
        const expectedVersion = params[params.length - 1];
        if (dbStore.profile.version !== expectedVersion) {
          return { success: false, meta: { changes: 0 } };
        }
        dbStore.profile.name = params[0];
        dbStore.profile.credential = params[1];
        dbStore.profile.designation = params[2];
        dbStore.profile.years_experience = params[3];
        dbStore.profile.version += 1;
        dbStore.profile.updated_at = new Date().toISOString();
        return { success: true, meta: { changes: 1 } };
      }

      if (sql.includes('UPDATE scholar_stats SET')) {
        const expectedVersion = params[params.length - 1];
        if (dbStore.scholar_stats.version !== expectedVersion) {
          return { success: false, meta: { changes: 0 } };
        }
        dbStore.scholar_stats.citations = params[0];
        dbStore.scholar_stats.h_index = params[1];
        dbStore.scholar_stats.i10_index = params[2];
        dbStore.scholar_stats.version += 1;
        dbStore.scholar_stats.updated_at = new Date().toISOString();
        return { success: true, meta: { changes: 1 } };
      }

      if (sql.includes('INSERT INTO publications')) {
        const [id, code_number, title, authors, venue, publication_type, year, doi, external_url, pdf_asset_id, featured, published, display_order, now1, now2, metadata] = params;
        const newPub = { id, code_number, title, authors, venue, publication_type, year, doi, external_url, pdf_asset_id, featured, published, display_order, version: 1, created_at: now1, updated_at: now2, metadata };
        dbStore.publications.set(id, newPub);
        return { success: true, meta: { changes: 1 } };
      }

      if (sql.includes('INSERT INTO talks')) {
        const [id, title, venue, date_string, year, featured, published, display_order, now1, now2, metadata] = params;
        dbStore.talks.set(id, { id, title, venue, date_string, year, featured, published, display_order, version: 1, created_at: now1, updated_at: now2, metadata });
        return { success: true, meta: { changes: 1 } };
      }

      if (sql.includes('INSERT INTO experience')) {
        const [id, role, organization, start_year, end_year, is_current, published, display_order, now1, now2, metadata] = params;
        dbStore.experience.set(id, { id, role, organization, start_year, end_year, is_current, published, display_order, version: 1, created_at: now1, updated_at: now2, metadata });
        return { success: true, meta: { changes: 1 } };
      }

      if (sql.includes('INSERT INTO education')) {
        const [id, degree, institution, year, thesis, published, display_order, now1, now2, metadata] = params;
        dbStore.education.set(id, { id, degree, institution, year, thesis, published, display_order, version: 1, created_at: now1, updated_at: now2, metadata });
        return { success: true, meta: { changes: 1 } };
      }

      if (sql.includes('INSERT INTO awards')) {
        const [id, title, organization, year, description, certificate_asset_id, published, display_order, now1, now2, metadata] = params;
        dbStore.awards.set(id, { id, title, organization, year, description, certificate_asset_id, published, display_order, version: 1, created_at: now1, updated_at: now2, metadata });
        return { success: true, meta: { changes: 1 } };
      }

      if (sql.includes('INSERT INTO skill_categories')) {
        const [id, category, skills_json, published, display_order, now1, now2, metadata] = params;
        dbStore.skill_categories.set(id, { id, category, skills_json, published, display_order, version: 1, created_at: now1, updated_at: now2, metadata });
        return { success: true, meta: { changes: 1 } };
      }

      if (sql.includes('INSERT INTO social_links')) {
        const [id, platform, url, icon, display_order, visible, published, now1, now2, metadata] = params;
        dbStore.social_links.set(id, { id, platform, url, icon, display_order, visible, published, version: 1, created_at: now1, updated_at: now2, metadata });
        return { success: true, meta: { changes: 1 } };
      }

      if (sql.includes('UPDATE publications SET')) {
        const expectedVersion = params[params.length - 1];
        const id = params[params.length - 2];
        const pub = dbStore.publications.get(id);
        if (!pub || pub.version !== expectedVersion) {
          return { success: false, meta: { changes: 0 } };
        }
        pub.title = params[1];
        pub.version += 1;
        pub.updated_at = new Date().toISOString();
        return { success: true, meta: { changes: 1 } };
      }

      if (sql.includes('DELETE FROM publications WHERE id = ? AND version = ?')) {
        const [id, expectedVersion] = params;
        const pub = dbStore.publications.get(id);
        if (!pub || pub.version !== expectedVersion) {
          return { success: false, meta: { changes: 0 } };
        }
        dbStore.publications.delete(id);
        return { success: true, meta: { changes: 1 } };
      }

      if (sql.includes('INSERT INTO revisions')) {
        dbStore.revisions.push({ params });
        return { success: true, meta: { changes: 1 } };
      }

      if (sql.includes('INSERT INTO scholar_sync_runs')) {
        const [sync_run_id, citations, h_index, i10_index, payload_sha256, now] = params;
        dbStore.scholar_sync_runs.set(sync_run_id, { sync_run_id, citations, h_index, i10_index, payload_sha256, status: 'success', created_at: now });
        return { success: true, meta: { changes: 1 } };
      }

      return { success: true, meta: { changes: 1 } };
    }
  };
}

const mockD1 = {
  prepare: (sql) => createStatementExecutor(sql)
};

const mockEnv = {
  DB: mockD1,
  ENVIRONMENT: 'test',
  ADMIN_EMAILS: 'lohithjj@gmail.com,assistant@ncet.edu.in',
  SCHOLAR_SYNC_SECRET: 'test-scholar-secret-999'
};

// Helper: Create Mock Cloudflare Access JWT Assertion
function createMockJwt(email, expSec = Math.floor(Date.now() / 1000) + 3600, overrides = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    email,
    sub: `user-${email}`,
    iss: 'https://drlohith.cloudflareaccess.com',
    aud: 'access-aud-tag-12345',
    exp: expSec,
    ...overrides
  })).toString('base64url');
  const signature = Buffer.from('mock-valid-signature').toString('base64url');
  return `${header}.${payload}.${signature}`;
}

// ----------------------------------------------------------------
// SUITE 1: PUBLIC HEALTH & READ ENDPOINTS
// ----------------------------------------------------------------
console.log('--- SUITE 1: PUBLIC HEALTH & READ ENDPOINTS ---');

// 1.1 Health
const healthReq = new Request('http://localhost/api/v1/health');
const healthRes = await worker.fetch(healthReq, mockEnv, {});
assert(healthRes.status === 200, '1.1 GET /api/v1/health returns 200');
const healthBody = await healthRes.json();
assert(healthBody.status === 'ok', '1.2 Health status is "ok"');
assert(healthRes.headers.get('Access-Control-Allow-Origin') !== null, '1.3 CORS headers present on health endpoint');

// 1.2 Profile
const profReq = new Request('http://localhost/api/v1/public/profile');
const profRes = await worker.fetch(profReq, mockEnv, {});
assert(profRes.status === 200, '1.4 GET /api/v1/public/profile returns 200');
const profBody = await profRes.json();
assert(profBody.name === 'Dr. Lohith J.J.', '1.5 Public profile name matches canonical value');
assert(profBody.credential === 'Ph.D. — NIT Trichy', '1.6 Public profile credential matches editorial value');
assert(profBody.version === undefined, '1.7 Internal version is stripped from public response DTO');
assert(profRes.headers.get('Cache-Control')?.includes('s-maxage=3600'), '1.8 Public cache headers present');

// 1.3 Scholar Stats
const statsReq = new Request('http://localhost/api/v1/public/scholar-stats');
const statsRes = await worker.fetch(statsReq, mockEnv, {});
assert(statsRes.status === 200, '1.9 GET /api/v1/public/scholar-stats returns 200');
const statsBody = await statsRes.json();
assert(statsBody.citations === 172, '1.10 Public citations match verified 172');
assert(statsBody.hIndex === 8, '1.11 Public hIndex matches verified 8');
assert(statsBody.i10Index === 8, '1.12 Public i10Index matches verified 8');

// 1.4 Publications
const pubsReq = new Request('http://localhost/api/v1/public/publications');
const pubsRes = await worker.fetch(pubsReq, mockEnv, {});
assert(pubsRes.status === 200, '1.13 GET /api/v1/public/publications returns 200');
const pubsBody = await pubsRes.json();
assert(pubsBody.length === 13, `1.14 Exactly 13 publications returned (got ${pubsBody.length})`);
assert(pubsBody[1].doi === '10.1007/s41870-024-01909-8', '1.15 J2 DOI correctly resolved');
assert(pubsBody[1].externalUrl === 'https://doi.org/10.1007/s41870-024-01909-8', '1.16 J2 clickable URL present');

// 1.5 Talks & Query Filtering
const talksReq = new Request('http://localhost/api/v1/public/talks');
const talksRes = await worker.fetch(talksReq, mockEnv, {});
assert(talksRes.status === 200, '1.17 GET /api/v1/public/talks returns 200');
const talksBody = await talksRes.json();
assert(talksBody.length === 53, `1.18 Exactly 53 talks returned (got ${talksBody.length})`);

const talks2026Req = new Request('http://localhost/api/v1/public/talks?year=2026');
const talks2026Res = await worker.fetch(talks2026Req, mockEnv, {});
const talks2026Body = await talks2026Res.json();
assert(talks2026Body.every(t => t.year === 2026), '1.19 Query param filter ?year=2026 filters talks cleanly');

// 1.6 Experience, Education, Awards, Skills, Social Links
const expRes = await worker.fetch(new Request('http://localhost/api/v1/public/experience'), mockEnv, {});
const expBody = await expRes.json();
assert(expBody.length === 6, `1.20 Exactly 6 experience items returned (got ${expBody.length})`);
assert(expBody[0].startYear === 'May 2026', '1.21 Current role starts May 2026');

const eduRes = await worker.fetch(new Request('http://localhost/api/v1/public/education'), mockEnv, {});
const eduBody = await eduRes.json();
assert(eduBody.length === 3, '1.22 Exactly 3 education items returned');

const awRes = await worker.fetch(new Request('http://localhost/api/v1/public/awards'), mockEnv, {});
const awBody = await awRes.json();
assert(awBody.length === 25, '1.23 Exactly 25 awards returned');

const skRes = await worker.fetch(new Request('http://localhost/api/v1/public/skills'), mockEnv, {});
const skBody = await skRes.json();
assert(skBody.length === 4, '1.24 Exactly 4 skill categories returned');

const slRes = await worker.fetch(new Request('http://localhost/api/v1/public/social-links'), mockEnv, {});
const slBody = await slRes.json();
assert(slBody.length === 7, '1.25 Exactly 7 social links returned');

// ----------------------------------------------------------------
// SUITE 2: CANONICAL PARITY (PUBLIC API <-> SNAPSHOT)
// ----------------------------------------------------------------
console.log('\n--- SUITE 2: CANONICAL SNAPSHOT 100% PARITY ---');
assert(profBody.name === snapshot.profile.name, '2.1 Profile name 100% parity');
assert(profBody.heroDescriptionLine1 === snapshot.profile.heroDescriptionLine1, '2.2 Profile HTML bio line 1 100% parity');
assert(statsBody.citations === snapshot.scholarStats.citations, '2.3 Scholar citations 100% parity');
assert(pubsBody.length === snapshot.publications.length, '2.4 Publications count 100% parity');
assert(talksBody.length === snapshot.talks.length, '2.5 Talks count 100% parity');
assert(awBody.length === snapshot.awards.length, '2.6 Awards count 100% parity');
assert(expBody.length === snapshot.experience.length, '2.7 Experience count 100% parity');
assert(eduBody.length === snapshot.education.length, '2.8 Education count 100% parity');
assert(skBody.length === snapshot.skillCategories.length, '2.9 Skill categories count 100% parity');
assert(slBody.length === snapshot.socialLinks.length, '2.10 Social links count 100% parity');

// ----------------------------------------------------------------
// SUITE 3: CORS & PREFLIGHT
// ----------------------------------------------------------------
console.log('\n--- SUITE 3: CORS & PREFLIGHT HANDLING ---');
const preflightReq = new Request('http://localhost/api/v1/public/publications', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://drlohithjj.com',
    'Access-Control-Request-Method': 'GET'
  }
});
const preflightRes = await worker.fetch(preflightReq, mockEnv, {});
assert(preflightRes.status === 204, '3.1 OPTIONS preflight returns 204 No Content');
assert(preflightRes.headers.get('Access-Control-Allow-Origin') === 'https://drlohithjj.com', '3.2 Whitelisted origin returned');
assert(preflightRes.headers.get('Access-Control-Allow-Methods')?.includes('GET'), '3.3 Allow-Methods header present');

// ----------------------------------------------------------------
// SUITE 4: CLOUDFLARE ACCESS IDENTITY & SECURITY BOUNDARY
// ----------------------------------------------------------------
console.log('\n--- SUITE 4: CLOUDFLARE ACCESS AUTHENTICATION & ALLOWLIST ---');

// 4.1 Missing Access Assertion
const noAuthReq = new Request('http://localhost/api/v1/admin/profile');
const noAuthRes = await worker.fetch(noAuthReq, mockEnv, {});
assert(noAuthRes.status === 401, '4.1 Admin route without Cf-Access-Jwt-Assertion returns 401 Unauthorized');
const noAuthBody = await noAuthRes.json();
assert(noAuthBody.error.code === 'UNAUTHORIZED', '4.2 Error code is UNAUTHORIZED');

// 4.2 Malformed JWT Assertion
const badJwtReq = new Request('http://localhost/api/v1/admin/profile', {
  headers: { 'Cf-Access-Jwt-Assertion': 'invalid-jwt-token' }
});
const badJwtRes = await worker.fetch(badJwtReq, mockEnv, {});
assert(badJwtRes.status === 401, '4.3 Malformed JWT assertion returns 401 Unauthorized');

// 4.3 Expired Assertion
const expiredJwt = createMockJwt('lohithjj@gmail.com', Math.floor(Date.now() / 1000) - 100);
const expiredReq = new Request('http://localhost/api/v1/admin/profile', {
  headers: { 'Cf-Access-Jwt-Assertion': expiredJwt }
});
const expiredRes = await worker.fetch(expiredReq, mockEnv, {});
assert(expiredRes.status === 401, '4.4 Expired assertion returns 401 Unauthorized');

// 4.4 Unauthorized Email (Not in Allowlist)
const intruderJwt = createMockJwt('intruder@unknown.com');
const intruderReq = new Request('http://localhost/api/v1/admin/profile', {
  headers: { 'Cf-Access-Jwt-Assertion': intruderJwt }
});
const intruderRes = await worker.fetch(intruderReq, mockEnv, {});
assert(intruderRes.status === 403, '4.5 Unlisted email returns 403 Forbidden');
const intruderBody = await intruderRes.json();
assert(intruderBody.error.code === 'FORBIDDEN', '4.6 Error code is FORBIDDEN');

// 4.5 Identity Spoofing Protection (Body email ignored)
const spoofReq = new Request('http://localhost/api/v1/admin/profile', {
  method: 'GET',
  headers: { 'X-Forwarded-Email': 'lohithjj@gmail.com' }
});
const spoofRes = await worker.fetch(spoofReq, mockEnv, {});
assert(spoofRes.status === 401, '4.7 Custom identity headers (spoofing) are strictly rejected');

// 4.6 Authorized Admin Email
const validAdminJwt = createMockJwt('lohithjj@gmail.com');
const authAdminReq = new Request('http://localhost/api/v1/admin/profile', {
  headers: { 'Cf-Access-Jwt-Assertion': validAdminJwt }
});
const authAdminRes = await worker.fetch(authAdminReq, mockEnv, {});
assert(authAdminRes.status === 200, '4.8 Authorized admin email in allowlist returns 200 OK');

// ----------------------------------------------------------------
// SUITE 5: PROTECTED ADMIN CRUD, CONCURRENCY & REVISIONS
// ----------------------------------------------------------------
console.log('\n--- SUITE 5: PROTECTED ADMIN CRUD & CONCURRENCY ---');

// 5.1 Profile Update - Concurrency Conflict (stale version)
const staleProfUpdateReq = new Request('http://localhost/api/v1/admin/profile', {
  method: 'PUT',
  headers: {
    'Cf-Access-Jwt-Assertion': validAdminJwt,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    version: 999, // Stale version
    name: 'Dr. Lohith J.J.',
    designation: 'Professor & HOD',
    yearsExperience: 20,
    currentInstitution: 'NCET',
    heroDescriptionLine1: 'Test bio 1',
    heroDescriptionLine2: 'Test bio 2',
    emailPrimary: 'lohithjj@gmail.com',
    phone: '+91-9886745882',
    address: 'NCET, Bengaluru',
    photoAsset: 'assets/Dr Lohith J J.jpeg',
    additionalRoles: [],
    professionalMemberships: []
  })
});
const staleProfRes = await worker.fetch(staleProfUpdateReq, mockEnv, {});
assert(staleProfRes.status === 409, '5.1 Stale version update returns 409 Conflict');
const staleProfBody = await staleProfRes.json();
assert(staleProfBody.error.code === 'CONCURRENCY_CONFLICT', '5.2 Error code is CONCURRENCY_CONFLICT');

// 5.2 Profile Update - Valid matching version
const validProfUpdateReq = new Request('http://localhost/api/v1/admin/profile', {
  method: 'PUT',
  headers: {
    'Cf-Access-Jwt-Assertion': validAdminJwt,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    version: 1, // Valid matching version
    name: 'Dr. Lohith J.J.',
    credential: 'Ph.D. — NIT Trichy',
    designation: 'Professor & Head of Department — CSE (IoT & Cybersecurity including Blockchain Technology)',
    yearsExperience: 20,
    currentInstitution: 'NCET, Bengaluru',
    heroDescriptionLine1: 'Updated line 1',
    heroDescriptionLine2: 'Updated line 2',
    emailPrimary: 'lohithjj@gmail.com',
    phone: '+91-9886745882',
    address: 'NCET, Bengaluru',
    photoAsset: 'assets/Dr Lohith J J.jpeg',
    additionalRoles: ['Guest Faculty BITS'],
    professionalMemberships: ['IEEE']
  })
});
const validProfRes = await worker.fetch(validProfUpdateReq, mockEnv, {});
assert(validProfRes.status === 200, '5.3 Valid matching version update returns 200 OK');
const validProfBody = await validProfRes.json();
assert(validProfBody.version === 2, '5.4 Version incremented to 2');
assert(dbStore.revisions.length > 0, '5.5 Revision record created in revisions table');

// 5.3 Publication Create
const newPubReq = new Request('http://localhost/api/v1/admin/publications', {
  method: 'POST',
  headers: {
    'Cf-Access-Jwt-Assertion': validAdminJwt,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: 'pub-test-created',
    codeNumber: 'J8',
    title: 'Advanced Blockchain Consensus in Heterogeneous Networks',
    authors: 'Lohith J.J. et al.',
    venue: 'IEEE Transactions on Services Computing',
    publicationType: 'journal',
    year: 2026,
    doi: '10.1109/TSC.2026.1234567',
    externalUrl: 'https://doi.org/10.1109/TSC.2026.1234567',
    featured: false,
    order: 14
  })
});
const newPubRes = await worker.fetch(newPubReq, mockEnv, {});
assert(newPubRes.status === 201, '5.6 POST /api/v1/admin/publications returns 201 Created');
const newPubBody = await newPubRes.json();
assert(newPubBody.id === 'pub-test-created', '5.7 Created publication ID matches request');
assert(newPubBody.version === 1, '5.8 Initial version is 1');

// 5.4 Publication Delete with Version Checking
const staleDelReq = new Request('http://localhost/api/v1/admin/publications/pub-test-created?version=99', {
  method: 'DELETE',
  headers: { 'Cf-Access-Jwt-Assertion': validAdminJwt }
});
const staleDelRes = await worker.fetch(staleDelReq, mockEnv, {});
assert(staleDelRes.status === 409, '5.9 Delete with stale version returns 409 Conflict');

const validDelReq = new Request('http://localhost/api/v1/admin/publications/pub-test-created?version=1', {
  method: 'DELETE',
  headers: { 'Cf-Access-Jwt-Assertion': validAdminJwt }
});
const validDelRes = await worker.fetch(validDelReq, mockEnv, {});
assert(validDelRes.status === 200, '5.10 Delete with valid version returns 200 OK');

// 5.5 Talks Admin CRUD
const newTalkReq = new Request('http://localhost/api/v1/admin/talks', {
  method: 'POST',
  headers: {
    'Cf-Access-Jwt-Assertion': validAdminJwt,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: 'talk-test-created',
    title: 'Future Trends in Post-Quantum Cryptography',
    venue: 'NIT Trichy National Symposium',
    dateString: 'October 2026',
    year: 2026,
    featured: true,
    order: 54
  })
});
const newTalkRes = await worker.fetch(newTalkReq, mockEnv, {});
assert(newTalkRes.status === 201, '5.11 POST /api/v1/admin/talks returns 201 Created');

// 5.6 Experience Admin CRUD
const newExpReq = new Request('http://localhost/api/v1/admin/experience', {
  method: 'POST',
  headers: {
    'Cf-Access-Jwt-Assertion': validAdminJwt,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: 'exp-test-created',
    role: 'Visiting Professor',
    organization: 'IISc Bengaluru',
    startYear: '2026',
    endYear: 'Present',
    isCurrent: true,
    order: 7
  })
});
const newExpRes = await worker.fetch(newExpReq, mockEnv, {});
assert(newExpRes.status === 201, '5.12 POST /api/v1/admin/experience returns 201 Created');

// 5.7 Education Admin CRUD
const newEduReq = new Request('http://localhost/api/v1/admin/education', {
  method: 'POST',
  headers: {
    'Cf-Access-Jwt-Assertion': validAdminJwt,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: 'edu-test-created',
    degree: 'Post-Doctoral Fellowship',
    institution: 'National University of Singapore',
    year: '2027',
    order: 4
  })
});
const newEduRes = await worker.fetch(newEduReq, mockEnv, {});
assert(newEduRes.status === 201, '5.13 POST /api/v1/admin/education returns 201 Created');

// 5.8 Awards Admin CRUD
const newAwardReq = new Request('http://localhost/api/v1/admin/awards', {
  method: 'POST',
  headers: {
    'Cf-Access-Jwt-Assertion': validAdminJwt,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: 'award-test-created',
    title: 'Distinguished Academician Award 2026',
    organization: 'VTU Karnataka',
    year: '2026',
    order: 26
  })
});
const newAwardRes = await worker.fetch(newAwardReq, mockEnv, {});
assert(newAwardRes.status === 201, '5.14 POST /api/v1/admin/awards returns 201 Created');

// 5.9 Skill Categories Admin CRUD
const newSkillReq = new Request('http://localhost/api/v1/admin/skills', {
  method: 'POST',
  headers: {
    'Cf-Access-Jwt-Assertion': validAdminJwt,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: 'skill-test-created',
    category: 'Quantum Computing & Post-Quantum Security',
    skills: ['Qiskit', 'Lattice Cryptography', 'Shor Algorithm Analysis'],
    order: 5
  })
});
const newSkillRes = await worker.fetch(newSkillReq, mockEnv, {});
assert(newSkillRes.status === 201, '5.15 POST /api/v1/admin/skills returns 201 Created');

// 5.10 Social Links Admin CRUD
const newSocialReq = new Request('http://localhost/api/v1/admin/social-links', {
  method: 'POST',
  headers: {
    'Cf-Access-Jwt-Assertion': validAdminJwt,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: 'social-test-created',
    platform: 'ACM Digital Library',
    url: 'https://dl.acm.org/profile/lohithjj',
    icon: 'acm.svg',
    order: 8,
    visible: true
  })
});
const newSocialRes = await worker.fetch(newSocialReq, mockEnv, {});
assert(newSocialRes.status === 201, '5.16 POST /api/v1/admin/social-links returns 201 Created');

// ----------------------------------------------------------------
// SUITE 6: AUTOMATION ENDPOINT & SCHOLAR IDEMPOTENCY
// ----------------------------------------------------------------
console.log('\n--- SUITE 6: SCHOLAR AUTOMATION & IDEMPOTENCY ---');

// 6.1 Missing Secret Token
const noSecretReq = new Request('http://localhost/api/v1/automation/scholar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ syncRunId: 'run-auto-1', citations: 172, hIndex: 8, i10Index: 8 })
});
const noSecretRes = await worker.fetch(noSecretReq, mockEnv, {});
assert(noSecretRes.status === 401, '6.1 Automation endpoint without Bearer secret returns 401 Unauthorized');

// 6.2 Valid Automation Request
const validAutoReq1 = new Request('http://localhost/api/v1/automation/scholar', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer test-scholar-secret-999',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    syncRunId: 'run-auto-001',
    citations: 175,
    hIndex: 8,
    i10Index: 8
  })
});
const validAutoRes1 = await worker.fetch(validAutoReq1, mockEnv, {});
assert(validAutoRes1.status === 200, '6.2 Valid automation request returns 200 OK');
const validAutoBody1 = await validAutoRes1.json();
assert(validAutoBody1.idempotencyResult === 'applied', '6.3 First run applied');
assert(dbStore.scholar_stats.citations === 175, '6.4 Scholar stats updated in D1');

// 6.3 Exact Idempotent Retry of same syncRunId
const retryAutoReq1 = new Request('http://localhost/api/v1/automation/scholar', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer test-scholar-secret-999',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    syncRunId: 'run-auto-001',
    citations: 175,
    hIndex: 8,
    i10Index: 8
  })
});
const retryAutoRes1 = await worker.fetch(retryAutoReq1, mockEnv, {});
assert(retryAutoRes1.status === 200, '6.5 Retry of same syncRunId returns 200 OK');
const retryAutoBody1 = await retryAutoRes1.json();
assert(retryAutoBody1.idempotencyResult === 'idempotent_duplicate', '6.6 Exact retry detected as idempotent duplicate (0 duplicate mutations)');

// ----------------------------------------------------------------
// SUITE 7: ASSET PRE-SIGNED URL BOUNDARY (PHASE 3 DESIGN)
// ----------------------------------------------------------------
console.log('\n--- SUITE 7: ASSET PRE-SIGNED URL BOUNDARY ---');
const presignReq = new Request('http://localhost/api/v1/admin/assets/presigned-url', {
  method: 'POST',
  headers: {
    'Cf-Access-Jwt-Assertion': validAdminJwt,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    filename: 'ICETCS_2026_Keynote.pdf',
    mimeType: 'application/pdf'
  })
});
const presignRes = await worker.fetch(presignReq, mockEnv, {});
assert(presignRes.status === 200, '7.1 POST /api/v1/admin/assets/presigned-url returns 200 OK');
const presignBody = await presignRes.json();
assert(presignBody.uploadKey.includes('ICETCS_2026_Keynote.pdf'), '7.2 Presigned upload key generated');
assert(presignBody.expiresInSeconds === 900, '7.3 Presigned URL has 15-minute expiration');

console.log('\n' + '='.repeat(70));
console.log(` PHASE 2 WORKER API TEST SUITE RESULTS: ${passed}/${passed + failed} PASSED`);
console.log('='.repeat(70) + '\n');

if (failed > 0) process.exit(1);
