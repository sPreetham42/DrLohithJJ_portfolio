import { describe, it, expect } from 'vitest';
import { handleCors, isOriginAllowed, normalizeOrigin, ALLOWED_ORIGINS } from '../worker/middleware/cors';

describe('Strict CORS Security Middleware', () => {
  it('allows canonical production origin', () => {
    const request = new Request('https://drlohithjj.in/api/v1/public/profile', {
      headers: { Origin: 'https://drlohithjj.in' }
    });
    const result = handleCors(request);

    expect(result.originAllowed).toBe(true);
    expect(result.headers['Access-Control-Allow-Origin']).toBe('https://drlohithjj.in');
    expect(result.headers['Access-Control-Allow-Credentials']).toBe('true');
  });

  it('allows www production origin', () => {
    const request = new Request('https://drlohithjj.in/api/v1/public/profile', {
      headers: { Origin: 'https://www.drlohithjj.in' }
    });
    const result = handleCors(request);

    expect(result.originAllowed).toBe(true);
    expect(result.headers['Access-Control-Allow-Origin']).toBe('https://www.drlohithjj.in');
  });

  it('allows authorized GitHub Pages origin', () => {
    const request = new Request('https://drlohithjj.in/api/v1/public/profile', {
      headers: { Origin: 'https://spreetham42.github.io' }
    });
    const result = handleCors(request);

    expect(result.originAllowed).toBe(true);
    expect(result.headers['Access-Control-Allow-Origin']).toBe('https://spreetham42.github.io');
  });

  it('strictly rejects arbitrary third-party .github.io suffix origins', () => {
    const maliciousOrigins = [
      'https://malicious-attacker.github.io',
      'https://phishing.github.io',
      'https://github.io',
      'https://attacker-spreetham42.github.io'
    ];

    for (const origin of maliciousOrigins) {
      const request = new Request('https://drlohithjj.in/api/v1/admin/profile', {
        headers: { Origin: origin }
      });
      const result = handleCors(request);

      expect(result.originAllowed).toBe(false);
      expect(result.headers['Access-Control-Allow-Origin']).toBeUndefined();
      expect(result.headers['Access-Control-Allow-Credentials']).toBeUndefined();
    }
  });

  it('strictly rejects random untrusted origins', () => {
    const untrustedOrigins = [
      'https://evil-site.com',
      'https://attacker.org',
      'http://localhost:8080',
      'https://drlohithjj.in.evil.com'
    ];

    for (const origin of untrustedOrigins) {
      const request = new Request('https://drlohithjj.in/api/v1/admin/profile', {
        headers: { Origin: origin }
      });
      const result = handleCors(request);

      expect(result.originAllowed).toBe(false);
      expect(result.headers['Access-Control-Allow-Origin']).toBeUndefined();
    }
  });

  it('rejects null and malformed origin headers', () => {
    const badOrigins = ['null', '', '   ', 'invalid-url'];
    for (const origin of badOrigins) {
      const request = new Request('https://drlohithjj.in/api/v1/admin/profile', {
        headers: { Origin: origin }
      });
      const result = handleCors(request);
      expect(result.originAllowed).toBe(false);
      expect(result.headers['Access-Control-Allow-Origin']).toBeUndefined();
    }
  });

  it('correctly handles OPTIONS preflight requests for allowed origins', () => {
    const request = new Request('https://drlohithjj.in/api/v1/admin/publications', {
      method: 'OPTIONS',
      headers: { Origin: 'https://drlohithjj.in' }
    });
    const result = handleCors(request);

    expect(result.isPreflight).toBe(true);
    expect(result.originAllowed).toBe(true);
    expect(result.headers['Access-Control-Allow-Methods']).toContain('PUT');
    expect(result.headers['Access-Control-Allow-Headers']).toContain('X-Admin-Request');
  });

  it('normalizes trailing slashes on valid origins', () => {
    expect(normalizeOrigin('https://drlohithjj.in/')).toBe('https://drlohithjj.in');
    expect(isOriginAllowed('https://drlohithjj.in/')).toBe(true);
  });
});
