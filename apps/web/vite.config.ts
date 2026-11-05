import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: { port: Number.parseInt(process.env.WEB_PORT ?? '5173', 10), strictPort: true },
  test: { environment: 'jsdom', setupFiles: './src/test-setup.ts' },
});
