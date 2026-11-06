import request from 'supertest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApp, startServer } from './server.js';

const temporaryDirectories: string[] = [];

afterEach(() => {
  vi.unstubAllEnvs();
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true });
});

describe('API smoke test', () => {
  it('returns a healthy response without exposing the framework header', async () => {
    const response = await request(createApp()).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('migrates the configured database and releases it when stopped', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'barbershop-server-'));
    temporaryDirectories.push(directory);
    const databasePath = join(directory, 'booking.sqlite');
    vi.stubEnv('DATABASE_PATH', databasePath);
    vi.stubEnv('ADMIN_USERNAME', 'local-admin');
    vi.stubEnv('ADMIN_PASSWORD', 'local-password');
    vi.stubEnv('API_PORT', '0');

    const server = startServer();
    await new Promise<void>((resolve, reject) => {
      server.on('listening', resolve);
      server.on('error', reject);
    });
    const address = server.address();
    if (address === null || typeof address === 'string') throw new Error('Missing TCP listener');
    const response = await fetch(`http://127.0.0.1:${String(address.port)}/api/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
    await new Promise<void>((resolve, reject) => server.close((error) => { if (error) reject(error); else resolve(); }));

    expect(() => { rmSync(databasePath, { force: true }); }).not.toThrow();
  });
});
