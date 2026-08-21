import { describe, it, expect } from 'vitest';
import { env, SELF } from 'cloudflare:test';

describe('Cloudflare Workers Runtime Verification', () => {
  it('exposes real D1 binding and environment variables', async () => {
    expect(env.DB).toBeDefined();
    expect(env.ENVIRONMENT).toBe('production');
  });
});
