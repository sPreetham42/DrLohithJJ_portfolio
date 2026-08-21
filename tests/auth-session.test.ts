import { describe, it, expect } from 'vitest';
import { generateRandomToken, parseCookies } from '../worker/handlers/auth.handler';
import { hashSessionToken } from '../worker/repositories/session.repository';

describe('D1 Admin Session & OAuth Cryptography', () => {
  it('generates high-entropy random hex tokens of expected length', () => {
    const token32 = generateRandomToken(32);
    expect(token32.length).toBe(64); // 32 bytes = 64 hex chars
    expect(/^[0-9a-f]+$/.test(token32)).toBe(true);

    const token16 = generateRandomToken(16);
    expect(token16.length).toBe(32);
  });

  it('computes deterministic SHA-256 hashes for session tokens', async () => {
    const rawToken = 'test-session-token-abcdef123456';
    const hash1 = await hashSessionToken(rawToken);
    const hash2 = await hashSessionToken(rawToken);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex string
    expect(hash1).not.toBe(rawToken);
  });

  it('correctly parses complex Cookie headers', () => {
    const header = '__Host-admin_session=token123; other_cookie=val%20456; pref=dark';
    const parsed = parseCookies(header);

    expect(parsed['__Host-admin_session']).toBe('token123');
    expect(parsed['other_cookie']).toBe('val 456');
    expect(parsed['pref']).toBe('dark');
  });

  it('handles null or empty Cookie headers gracefully', () => {
    expect(parseCookies(null)).toEqual({});
    expect(parseCookies('')).toEqual({});
  });
});
