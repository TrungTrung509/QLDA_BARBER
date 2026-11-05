import request from 'supertest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { createApp, startServer } from './server.js';

const temporaryDirectories: string[] = [];

afterEach(() => {
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
    process.env.DATABASE_PATH = join(directory, 'booking.sqlite');
    process.env.ADMIN_USERNAME = 'local-admin';
    process.env.ADMIN_PASSWORD = 'local-password';
    process.env.API_PORT = '0';

    const server = startServer();
    await new Promise<void>((resolve, reject) => {
      server.on('listening', resolve);
      server.on('error', reject);
    });
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));

    expect(() => rmSync(process.env.DATABASE_PATH!, { force: true })).not.toThrow();
  });
});
