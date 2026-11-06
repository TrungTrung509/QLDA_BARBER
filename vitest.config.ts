import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: { provider: 'v8', reporter: ['text', 'html'] },
    fileParallelism: false,
    maxWorkers: 1,
    projects: [
      {
        test: {
          name: 'api',
          environment: 'node',
          include: ['apps/api/src/**/*.test.ts'],
          exclude: ['**/*.integration.test.ts'],
        },
      },
      {
        test: {
          name: 'web',
          environment: 'jsdom',
          include: ['apps/web/src/**/*.test.{ts,tsx}'],
          setupFiles: ['./apps/web/src/test-setup.ts'],
        },
      },
    ],
  },
});
