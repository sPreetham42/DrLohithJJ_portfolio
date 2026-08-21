import { defineConfig } from 'vitest/config';
import { cloudflareTest } from '@cloudflare/vitest-pool-workers';

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: {
        configPath: './wrangler.toml',
      },
      miniflare: {
        bindings: {
          ENVIRONMENT: 'production',
          AUTH_MODE: 'SESSION',
          ADMIN_GITHUB_USERS: '175527963,39591861',
          SCHOLAR_SYNC_SECRET: 'test-workers-scholar-secret-12345'
        }
      }
    }),
  ],
  test: {
    include: ['tests/workers/**/*.test.ts'],
  },
});
