import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['apps/api/src/**/*.integration.test.ts', 'apps/api/src/modules/api.test.ts'],
    fileParallelism: false,
    maxWorkers: 1,
    passWithNoTests: false,
    testTimeout: 15_000,
  },
});
