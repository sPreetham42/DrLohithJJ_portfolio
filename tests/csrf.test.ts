import { describe, it, expect, vi } from 'vitest';
import { authenticateAdmin } from '../worker/middleware/auth';
import { handleCors } from '../worker/middleware/cors';
import { Env } from '../worker/types';

describe('CSRF & CORS Red Team Security Audit', () => {
  const createMockSessionDb = () => {
    const sessionToken = 'valid-session-token-12345';
    return {
      prepare: vi.fn((sql: string) => ({
        bind: vi.fn((...args: any[]) => ({
          first: vi.fn(async () => {
            if (sql.includes('FROM admin_sessions')) {
              return {
                id: 'sess-1',
                session_token_hash: 'hash123',
                github_user_id: 175527963,
                github_login: 'lohithjj',
                user_email: 'lohithjj@gmail.com',
                user_name: 'Dr. Lohith J.J.',
                expires_at: new Date(Date.now() + 3600000).toISOString(),
                created_at: new Date().toISOString(),
                last_used_at: new Date().toISOString()
              };
            }
            return null;
          }),
          run: vi.fn(async () => ({ success: true, meta: { changes: 1 } }))
        }))
      }))
    } as unknown as D1Database;
  };

  const createSessionEnv = (): Env => ({
    DB: createMockSessionDb(),
    ENVIRONMENT: 'production',
    AUTH_MODE: 'SESSION',
    ADMIN_GITHUB_USERS: '175527963,lohithjj'
  });

  it('Scenario 1: Attacker origin https://evil.github.io is rejected by CORS', () => {
    const request = new Request('https://drlohithjj.in/api/v1/admin/publications', {
      headers: { Origin: 'https://evil.github.io' }
    });
    const result = handleCors(request);
    expect(result.originAllowed).toBe(false);
    expect(result.headers['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('Scenario 2: Attacker origin https://anything.github.io is rejected by CORS', () => {
    const request = new Request('https://drlohithjj.in/api/v1/admin/profile', {
      headers: { Origin: 'https://anything.github.io' }
    });
    const result = handleCors(request);
    expect(result.originAllowed).toBe(false);
    expect(result.headers['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('Scenario 3: Null Origin header is rejected by CORS', () => {
    const request = new Request('https://drlohithjj.in/api/v1/admin/profile', {
      headers: { Origin: 'null' }
    });
    const result = handleCors(request);
    expect(result.originAllowed).toBe(false);
  });

  it('Scenario 4: Missing Origin header receives no cross-origin allow headers', () => {
    const request = new Request('https://drlohithjj.in/api/v1/admin/profile');
    const result = handleCors(request);
    expect(result.originAllowed).toBe(false);
    expect(result.headers['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('Scenario 5 & 6: Cross-origin POST with cookies but without X-Admin-Request is rejected', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/admin/publications', {
      method: 'POST',
      headers: {
        Cookie: '__Host-admin_session=valid-session-token-12345',
        'Content-Type': 'application/json'
        // No X-Admin-Request header
      },
      body: JSON.stringify({ title: 'Exploit Title' })
    });

    await expect(authenticateAdmin(request, createSessionEnv())).rejects.toThrow(
      'Missing or invalid X-Admin-Request CSRF protection header'
    );
  });

  it('Scenario 7: State-changing request explicitly marked Sec-Fetch-Site: cross-site is rejected', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/admin/publications', {
      method: 'DELETE',
      headers: {
        Cookie: '__Host-admin_session=valid-session-token-12345',
        'X-Admin-Request': '1',
        'Sec-Fetch-Site': 'cross-site'
      }
    });

    await expect(authenticateAdmin(request, createSessionEnv())).rejects.toThrow(
      'Cross-site state-changing requests are strictly forbidden'
    );
  });

  it('Scenario 8: Same-origin authenticated state-changing mutation with X-Admin-Request succeeds', async () => {
    const request = new Request('https://drlohithjj.in/api/v1/admin/publications', {
      method: 'POST',
      headers: {
        Cookie: '__Host-admin_session=valid-session-token-12345',
        'X-Admin-Request': '1',
        'Sec-Fetch-Site': 'same-origin',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: 'Legitimate Publication' })
    });

    const user = await authenticateAdmin(request, createSessionEnv());
    expect(user.email).toBe('lohithjj@gmail.com');
  });
});
