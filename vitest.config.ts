import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: { provider: 'v8', reporter: ['text', 'html'] },
    environment: 'jsdom',
    fileParallelism: false,
    maxWorkers: 1,
    setupFiles: ['./apps/web/src/test-setup.ts'],
    exclude: ['e2e/**', '**/node_modules/**', '**/dist/**', '**/*.integration.test.ts'],
  },
});
