import express from 'express';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { migrateDatabase, openDatabase, seedDatabase } from '../db/database.js';
import { registerApiRoutes } from './api.js';

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true });
});

describe('SQLite booking concurrency', () => {
  it('commits exactly one overlapping request across independent connections', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'barbershop-race-'));
    directories.push(directory);
    const path = join(directory, 'shared.sqlite');
    const setup = openDatabase(path);
    migrateDatabase(setup, join(apiRoot, 'migrations'));
    seedDatabase(setup, join(apiRoot, 'seeds'));
    setup.close();

    const firstDatabase = openDatabase(path);
    const secondDatabase = openDatabase(path);
    const makeApp = (database: typeof firstDatabase) => {
      const app = express();
      app.use(express.json());
      registerApiRoutes(app, {
        database,
        config: { adminUsername: 'admin', adminPassword: 'password', allowedOrigin: 'http://localhost:5173', secureCookies: false },
        now: () => new Date('2030-01-01T00:00:00.000Z'),
      });
      return app;
    };
    const payload = { serviceId: 'service-deluxe', barberId: 'barber-alex', startAt: '2030-01-07T09:00:00.000Z', customer: { name: 'Pat', phone: '12345' } };
    try {
      const [first, second] = await Promise.all([
        request(makeApp(firstDatabase)).post('/api/appointments').send(payload),
        request(makeApp(secondDatabase)).post('/api/appointments').send({ ...payload, customer: { name: 'Lee', phone: '67890' } }),
      ]);
      expect([first.status, second.status].sort()).toEqual([201, 409]);
      const count = firstDatabase.prepare("SELECT COUNT(*) AS count FROM appointments WHERE status = 'PENDING'").get() as { count: number };
      expect(count.count).toBe(1);
    } finally {
      firstDatabase.close();
      secondDatabase.close();
    }
  });
});
