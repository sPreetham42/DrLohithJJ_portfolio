import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/workers/**', 'node_modules/**'],
    pool: 'threads',
    fileParallelism: false
  }
});
