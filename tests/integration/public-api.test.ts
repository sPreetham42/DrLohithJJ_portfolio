// ================================================================
// REAL WORKER + D1 INTEGRATION TEST: PUBLIC READ API
// Tests the real Worker entrypoint (routeRequest), real handlers,
// real repositories, and real SQLite D1 schema with migrations applied.
// ================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { routeRequest } from '../../worker/router';
import { Env } from '../../worker/types';
import { createLocalTestD1, seedLocalTestD1, LocalD1Database } from '../helpers/d1-sqlite';

describe('Real Worker + D1 Integration: Public Read Endpoints', () => {
  let localDb: LocalD1Database;
  let testEnv: Env;

  beforeAll(async () => {
    // 1. Create fresh SQLite database and apply migrations 0001-0005
    localDb = await createLocalTestD1();
    // 2. Seed canonical snapshot data
    await seedLocalTestD1(localDb);

    testEnv = {
      DB: localDb,
      ENVIRONMENT: 'production',
      AUTH_MODE: 'SESSION',
      ADMIN_EMAILS: 'lohithjj@gmail.com'
    };
  });

  it('GET /api/v1/health returns status ok with database connectivity', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/health');
    const response = await routeRequest(request, testEnv);
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.status).toBe('ok');
    expect(body.environment).toBe('production');
    expect(body.timestamp).toBeDefined();
  });

  it('GET /api/v1/public/profile returns database-backed profile data', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/public/profile');
    const response = await routeRequest(request, testEnv);
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('s-maxage=120');

    const body = (await response.json()) as any;
    expect(body.name).toBe('Dr. Lohith J.J.');
    expect(body.designation).toContain('Professor');
    expect(body.yearsExperience).toBeGreaterThanOrEqual(20);
    expect(body.emailPrimary).toBe('lohithjj@gmail.com');
    expect(body.additionalRoles).toBeInstanceOf(Array);
    expect(body.professionalMemberships).toBeInstanceOf(Array);
  });

  it('GET /api/v1/public/scholar-stats returns database-backed citation metrics', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/public/scholar-stats');
    const response = await routeRequest(request, testEnv);
    expect(response.status).toBe(200);

    const body = (await response.json()) as any;
    expect(body.citations).toBe(172);
    expect(body.hIndex).toBe(8);
    expect(body.i10Index).toBe(8);
    expect(body.sciePapersCount).toBe(4);
    expect(body.ieeeConferencesCount).toBe(6);
  });

  it('GET /api/v1/public/publications returns all published publications ordered by display_order & year', async () => {
    const requestAll = new Request('https://drlohithjj.in/api/v1/public/publications');
    const responseAll = await routeRequest(requestAll, testEnv);
    expect(responseAll.status).toBe(200);
    const bodyAll = (await responseAll.json()) as any;
    expect(bodyAll.length).toBe(13);
    expect(bodyAll[0].codeNumber).toBe('J1');
    expect(bodyAll[0].title).toBeDefined();
    expect(bodyAll[0].authors).toBeDefined();
    expect(bodyAll[0].venue).toBeDefined();
    expect(bodyAll[0].publicationType).toBe('journal');
  });

  it('GET /api/v1/public/talks returns published talks in display order', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/public/talks');
    const response = await routeRequest(request, testEnv);
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.length).toBe(43);
    expect(body[0].title).toBeDefined();
    expect(body[0].venue).toBeDefined();
    expect(body[0].year).toBeDefined();
  });

  it('GET /api/v1/public/experience returns published experience history', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/public/experience');
    const response = await routeRequest(request, testEnv);
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.length).toBe(6);
    expect(body[0].role).toBeDefined();
    expect(body[0].organization).toBeDefined();
  });

  it('GET /api/v1/public/education returns published education credentials', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/public/education');
    const response = await routeRequest(request, testEnv);
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.length).toBe(3);
    expect(body.some((e: any) => e.degree.includes('Ph.D.'))).toBe(true);
  });

  it('GET /api/v1/public/awards returns published awards and recognitions', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/public/awards');
    const response = await routeRequest(request, testEnv);
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.length).toBe(25);
    expect(body[0].title).toBeDefined();
    expect(body[0].organization).toBeDefined();
  });

  it('GET /api/v1/public/skills returns skill categories and lists', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/public/skills');
    const response = await routeRequest(request, testEnv);
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.length).toBe(4);
    expect(body[0].category).toBeDefined();
    expect(body[0].skills).toBeInstanceOf(Array);
  });

  it('GET /api/v1/public/social-links returns public social links', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/public/social-links');
    const response = await routeRequest(request, testEnv);
    expect(response.status).toBe(200);
    const body = (await response.json()) as any;
    expect(body.length).toBe(7);
    expect(body[0].platform).toBeDefined();
    expect(body[0].url).toBeDefined();
  });
});
