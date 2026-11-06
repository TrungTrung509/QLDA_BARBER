import express from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { migrateDatabase, openDatabase, seedDatabase } from '../db/database.js';
import { registerApiRoutes } from './api.js';

// Supertest leaves parsed JSON untyped; describe the contract asserted below.
type TestBody = {
  data: {
    slots: { startAt: string; localStart: string }[];
    appointment: { id: string; customer?: unknown };
    appointments: { customer: { phone: string } }[];
  };
  error?: { code: string };
};
function responseBody(response: { body: unknown }): TestBody { return response.body as TestBody; }

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
    expect(responseBody(availability).data.slots[0]).toEqual(expect.objectContaining({ startAt: '2030-01-07T09:00:00.000Z', endAt: '2030-01-07T10:00:00.000Z' }));

    const past = await request(app).post('/api/appointments').send({ serviceId: 'service-classic', barberId: 'barber-alex', startAt: '2029-01-01T09:00:00.000Z', customer: { name: 'Pat', phone: '12345' } });
    expect(past.status).toBe(422);
    expect(responseBody(past).error?.code).toBe('PAST_SLOT');
  });

  it('atomically allows exactly one of two overlapping creates', async () => {
    const app = createTestApp();
    const payload = { serviceId: 'service-deluxe', barberId: 'barber-alex', startAt: '2030-01-07T09:00:00.000Z', customer: { name: 'Pat', phone: '12345' } };
    const [first, second] = await Promise.all([
      request(app).post('/api/appointments').send(payload),
      request(app).post('/api/appointments').send({ ...payload, customer: { name: 'Lee', phone: '67890' } }),
    ]);
    expect([first.status, second.status].sort()).toEqual([201, 409]);
    expect([responseBody(first).error?.code, responseBody(second).error?.code]).toContain('SLOT_UNAVAILABLE');
    const count = database.prepare("SELECT COUNT(*) count FROM appointments WHERE status='PENDING'").get() as { count: number };
    expect(count.count).toBe(1);
  });

  it('rejects unauthorized admin access and validates allowed login origin', async () => {
    const app = createTestApp();
    const unauthorized = await request(app).get('/api/admin/appointments');
    expect(unauthorized.status).toBe(401);
    expect(responseBody(unauthorized).error?.code).toBe('UNAUTHENTICATED');

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
    expect(responseBody(filtered).data.appointments[0]).toEqual(expect.objectContaining({ id: responseBody(created).data.appointment.id, status: 'PENDING' }));
    expect(responseBody(filtered).data.appointments[0]?.customer.phone).toBe('12345');
    await agent.patch(`/api/admin/appointments/${responseBody(created).data.appointment.id}/status`).set('Origin', 'http://localhost:5173').send({ status: 'CANCELLED' }).expect(200);
    const reused = await request(app).post('/api/appointments').send({ ...payload, customer: { name: 'Lee', phone: '67890' } });
    expect(reused.status).toBe(201);
    const invalid = await agent.patch(`/api/admin/appointments/${responseBody(created).data.appointment.id}/status`).set('Origin', 'http://localhost:5173').send({ status: 'COMPLETED' });
    expect(invalid.status).toBe(409);
    expect(responseBody(invalid).error?.code).toBe('INVALID_STATUS_TRANSITION');
  });
});

describe('rejected review regressions', () => {
  const payload = { serviceId: 'service-classic', barberId: 'barber-alex', startAt: '2030-01-07T09:00:00.000Z', customer: { name: 'Private Customer', phone: '12345', email: 'private@example.test' } };
  it('fails closed for missing and disallowed Origin on login, logout and authenticated PATCH', async () => {
    const app = createTestApp();
    const created = await request(app).post('/api/appointments').send(payload);
    const agent = request.agent(app);
    await agent.post('/api/auth/login').set('Origin', 'http://localhost:5173').send({ username: 'admin', password: 'test-password' }).expect(204);
    for (const origin of [undefined, 'https://evil.example']) {
      for (const path of ['/api/auth/login', '/api/auth/logout']) {
        const call = agent.post(path);
        if (origin) call.set('Origin', origin);
        const result = await call.send({ username: 'admin', password: 'test-password' });
        expect(result.status).toBe(403);
        expect(responseBody(result).error?.code).toBe('FORBIDDEN');
      }
      const call = agent.patch(`/api/admin/appointments/${responseBody(created).data.appointment.id}/status`);
      if (origin) call.set('Origin', origin);
      await call.send({ status: 'CANCELLED' }).expect(403);
    }
    const row = database.prepare('SELECT status FROM appointments').get() as { status: string };
    expect(row.status).toBe('PENDING');
  });

  it.each([
    ['2030-01-07T09:01:00Z', 'INVALID_TIME'],
    ['2030-01-07T09:00:01Z', 'INVALID_TIME'],
    ['2030-01-07T18:00:00Z', 'OUTSIDE_WORKING_HOURS'],
    ['2030-01-06T09:00:00Z', 'OUTSIDE_WORKING_HOURS'],
  ])('classifies invalid booking %s as 422 %s', async (startAt, code) => {
    const result = await request(createTestApp()).post('/api/appointments').send({ ...payload, startAt });
    expect(result.status).toBe(422);
    expect(responseBody(result).error?.code).toBe(code);
  });

  it('allows adjacent intervals and different barbers, rejects duration spill and overlap', async () => {
    const app = createTestApp();
    await request(app).post('/api/appointments').send({ ...payload, serviceId: 'service-deluxe' }).expect(201);
    await request(app).post('/api/appointments').send({ ...payload, barberId: 'barber-sam' }).expect(201);
    await request(app).post('/api/appointments').send({ ...payload, startAt: '2030-01-07T10:00:00Z' }).expect(201);
    const overlap = await request(app).post('/api/appointments').send({ ...payload, startAt: '2030-01-07T09:30:00Z' });
    expect(overlap.status).toBe(409);
    expect(responseBody(overlap).error?.code).toBe('SLOT_UNAVAILABLE');
    const spill = await request(app).post('/api/appointments').send({ ...payload, serviceId: 'service-deluxe', startAt: '2030-01-07T16:30:00Z' });
    expect(spill.status).toBe(422);
    expect(responseBody(spill).error?.code).toBe('OUTSIDE_WORKING_HOURS');
  });

  it('offers and books ISO Sunday 7', async () => {
    database.prepare('INSERT INTO barber_hours VALUES (?,?,?,?)').run('barber-alex', 7, 540, 1020);
    database.prepare('INSERT INTO shop_hours VALUES (?,?,?,?)').run('shop-default', 7, 540, 1020);
    const app = createTestApp();
    const slots = await request(app).get('/api/availability').query({ serviceId: payload.serviceId, barberId: payload.barberId, date: '2030-01-06' });
    expect(responseBody(slots).data.slots[0]?.startAt).toBe('2030-01-06T09:00:00.000Z');
    await request(app).post('/api/appointments').send({ ...payload, startAt: '2030-01-06T09:00:00Z' }).expect(201);
  });

  it('rolls back customer insertion and sanitizes database failures', async () => {
    database.exec("CREATE TRIGGER fail_booking BEFORE INSERT ON appointments BEGIN SELECT RAISE(ABORT, 'sensitive database detail'); END");
    const result = await request(createTestApp()).post('/api/appointments').send(payload);
    expect(result.status).toBe(500);
    expect(responseBody(result)).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
    expect(database.prepare('SELECT COUNT(*) n FROM customers').get()).toEqual({ n: 0 });
    expect(database.prepare('SELECT COUNT(*) n FROM appointments').get()).toEqual({ n: 0 });
    database.exec('DROP TRIGGER fail_booking');
    await request(createTestApp()).post('/api/appointments').send(payload).expect(201);
  });

  it('rejects invalid/inactive resources and keeps public responses free of customer data', async () => {
    const app = createTestApp();
    await request(app).post('/api/appointments').send({ ...payload, startAt: 'invalid' }).expect(422);
    for (const table of ['services', 'barbers']) {
      database.exec(`UPDATE ${table} SET active=0`);
      const result = await request(app).post('/api/appointments').send(payload);
      expect(result.status).toBe(404);
      expect(responseBody(result).error?.code).toBe(table === 'services' ? 'SERVICE_NOT_FOUND' : 'BARBER_NOT_FOUND');
      database.exec(`UPDATE ${table} SET active=1`);
    }
    const created = await request(app).post('/api/appointments').send(payload);
    expect(JSON.stringify(responseBody(created))).not.toContain('private@example.test');
    expect(responseBody(created).data.appointment.customer).toBeUndefined();
    const availability = await request(app).get('/api/availability').query({ serviceId: payload.serviceId, barberId: payload.barberId, date: '2030-01-07' });
    expect(JSON.stringify(responseBody(availability))).not.toContain('Private Customer');
    await request(app).patch(`/api/admin/appointments/${responseBody(created).data.appointment.id}/status`).set('Origin', 'http://localhost:5173').send({ status: 'CANCELLED' }).expect(401);
  });
});

describe('DST boundaries in shop-local scheduling', () => {
  function sundayApp() {
    database.prepare('UPDATE shop_settings SET timezone=?').run('America/New_York');
    database.prepare('INSERT INTO barber_hours VALUES (?,?,?,?)').run('barber-alex', 7, 0, 240);
    database.prepare('INSERT INTO shop_hours VALUES (?,?,?,?)').run('shop-default', 7, 0, 240);
    return createTestApp();
  }
  it('omits both repeated local slots and rejects either fall-back instant as INVALID_TIME', async () => {
    const app = sundayApp();
    const availability = await request(app).get('/api/availability').query({ serviceId: 'service-classic', barberId: 'barber-alex', date: '2030-11-03' });
    expect(availability.status).toBe(200);
    const starts = responseBody(availability).data.slots.map((slot) => slot.startAt);
    expect(starts).not.toContain('2030-11-03T05:30:00.000Z');
    expect(starts).not.toContain('2030-11-03T06:30:00.000Z');
    for (const startAt of ['2030-11-03T01:30:00-04:00', '2030-11-03T01:30:00-05:00']) {
      const result = await request(app).post('/api/appointments').send({ serviceId: 'service-classic', barberId: 'barber-alex', startAt, customer: { name: 'DST', phone: '12345' } });
      expect(result.status).toBe(422);
      expect(responseBody(result).error?.code).toBe('INVALID_TIME');
    }
  });
  it('omits nonexistent spring-forward local times and intervals crossing the clock gap', async () => {
    const app = sundayApp();
    const availability = await request(app).get('/api/availability').query({ serviceId: 'service-classic', barberId: 'barber-alex', date: '2030-03-10' });
    expect(availability.status).toBe(200);
    const slots = responseBody(availability).data.slots;
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.some((slot) => slot.localStart.startsWith('2030-03-10T02:'))).toBe(false);
    expect(slots.some((slot) => slot.localStart === '2030-03-10T01:30')).toBe(false);
    expect(slots.some((slot) => slot.localStart === '2030-03-10T03:00')).toBe(true);
    const crossing = await request(app).post('/api/appointments').send({ serviceId: 'service-classic', barberId: 'barber-alex', startAt: '2030-03-10T01:30:00-05:00', customer: { name: 'Gap', phone: '12345' } });
    expect(crossing.status).toBe(422);
    expect(responseBody(crossing).error?.code).toBe('INVALID_TIME');
  });
});
