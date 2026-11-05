import express from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { migrateDatabase, openDatabase, seedDatabase } from '../db/database.js';
import { registerApiRoutes } from './api.js';

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const futureNow = new Date('2030-01-01T00:00:00.000Z');
let database: ReturnType<typeof openDatabase>;

function createTestApp() {
  const app = express();
  app.use(express.json());
  registerApiRoutes(app, {
    database,
    config: { adminUsername: 'admin', adminPassword: 'test-password', allowedOrigin: 'http://localhost:5173', secureCookies: false },
    now: () => futureNow,
  });
  return app;
}

beforeEach(() => {
  database = openDatabase(':memory:');
  migrateDatabase(database, join(apiRoot, 'migrations'));
  seedDatabase(database, join(apiRoot, 'seeds'));
});
afterEach(() => database.close());

describe('booking API', () => {
  it('returns duration-aware availability and rejects past appointments', async () => {
    const app = createTestApp();
    const availability = await request(app).get('/api/availability').query({ serviceId: 'service-deluxe', barberId: 'barber-alex', date: '2030-01-07' });
    expect(availability.status).toBe(200);
    expect(availability.body.data.slots[0]).toEqual(expect.objectContaining({ startAt: '2030-01-07T09:00:00.000Z', endAt: '2030-01-07T10:00:00.000Z' }));

    const past = await request(app).post('/api/appointments').send({ serviceId: 'service-classic', barberId: 'barber-alex', startAt: '2029-01-01T09:00:00.000Z', customer: { name: 'Pat', phone: '12345' } });
    expect(past.status).toBe(422);
    expect(past.body.error.code).toBe('PAST_SLOT');
  });

  it('atomically allows exactly one of two overlapping creates', async () => {
    const app = createTestApp();
    const payload = { serviceId: 'service-deluxe', barberId: 'barber-alex', startAt: '2030-01-07T09:00:00.000Z', customer: { name: 'Pat', phone: '12345' } };
    const [first, second] = await Promise.all([
      request(app).post('/api/appointments').send(payload),
      request(app).post('/api/appointments').send({ ...payload, customer: { name: 'Lee', phone: '67890' } }),
    ]);
    expect([first.status, second.status].sort()).toEqual([201, 409]);
    expect([first.body.error?.code, second.body.error?.code]).toContain('SLOT_UNAVAILABLE');
    const count = database.prepare("SELECT COUNT(*) count FROM appointments WHERE status='PENDING'").get() as { count: number };
    expect(count.count).toBe(1);
  });

  it('rejects unauthorized admin access and validates allowed login origin', async () => {
    const app = createTestApp();
    const unauthorized = await request(app).get('/api/admin/appointments');
    expect(unauthorized.status).toBe(401);
    expect(unauthorized.body.error.code).toBe('UNAUTHENTICATED');

    const forbidden = await request(app).post('/api/auth/login').set('Origin', 'https://evil.example').send({ username: 'admin', password: 'test-password' });
    expect(forbidden.status).toBe(403);
    const login = await request(app).post('/api/auth/login').set('Origin', 'http://localhost:5173').send({ username: 'admin', password: 'test-password' });
    expect(login.status).toBe(204);
    expect(login.headers['set-cookie']?.[0]).toContain('HttpOnly');
  });

  it('releases a cancelled slot and enforces terminal status transitions', async () => {
    const app = createTestApp();
    const payload = { serviceId: 'service-classic', barberId: 'barber-alex', startAt: '2030-01-07T09:00:00.000Z', customer: { name: 'Pat', phone: '12345' } };
    const created = await request(app).post('/api/appointments').send(payload);
    const agent = request.agent(app);
    await agent.post('/api/auth/login').set('Origin', 'http://localhost:5173').send({ username: 'admin', password: 'test-password' }).expect(204);
    const filtered = await agent.get('/api/admin/appointments').query({ status: 'PENDING', date: '2030-01-07', barberId: 'barber-alex' });
    expect(filtered.body.data.appointments[0]).toEqual(expect.objectContaining({ id: created.body.data.appointment.id, status: 'PENDING' }));
    expect(filtered.body.data.appointments[0].customer.phone).toBe('12345');
    await agent.patch(`/api/admin/appointments/${created.body.data.appointment.id}/status`).set('Origin', 'http://localhost:5173').send({ status: 'CANCELLED' }).expect(200);
    const reused = await request(app).post('/api/appointments').send({ ...payload, customer: { name: 'Lee', phone: '67890' } });
    expect(reused.status).toBe(201);
    const invalid = await agent.patch(`/api/admin/appointments/${created.body.data.appointment.id}/status`).set('Origin', 'http://localhost:5173').send({ status: 'COMPLETED' });
    expect(invalid.status).toBe(409);
    expect(invalid.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });
});
