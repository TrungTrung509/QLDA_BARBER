import { fork, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { migrateDatabase, openDatabase, seedDatabase } from '../db/database.js';

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const directories: string[] = [];
const children: ChildProcess[] = [];
const payload = { serviceId: 'service-deluxe', barberId: 'barber-alex', startAt: '2030-01-07T09:00:00.000Z', customer: { name: 'Persistent Customer', phone: '12345', email: 'persist@example.test' } };

function receive(child: ChildProcess, type: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(new Error(`Timed out waiting for ${type}`)); }, 10_000);
    const cleanup = () => { clearTimeout(timer); child.off('message', onMessage); child.off('exit', onExit); };
    const onExit = (code: number | null) => { cleanup(); reject(new Error(`Application exited ${String(code)} before ${type}`)); };
    const onMessage = (message: Record<string, unknown>) => { if (message.type === type) { cleanup(); resolve(message); } };
    child.on('message', onMessage);
    child.once('exit', onExit);
  });
}

async function start(path: string) {
  const child = fork(join(apiRoot, 'src/modules/fixtures/booking-process.mjs'), [path], { execArgv: ['--import', 'tsx'], stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
  children.push(child);
  const ready = await receive(child, 'ready');
  return { child, url: `http://127.0.0.1:${String(ready.port)}` };
}
async function stop(child: ChildProcess) {
  const exited = once(child, 'exit');
  child.send({ type: 'stop' });
  const exitResult: unknown[] = await exited;
  const code = exitResult[0];
  expect(code).toBe(0);
}
function setup() {
  const directory = mkdtempSync(join(tmpdir(), 'barbershop-process-'));
  directories.push(directory);
  const path = join(directory, 'shared.sqlite');
  const database = openDatabase(path);
  migrateDatabase(database, join(apiRoot, 'migrations'));
  seedDatabase(database, join(apiRoot, 'seeds'));
  database.close();
  return path;
}
afterEach(async () => {
  await Promise.all(children.splice(0).map(async (child) => {
    if (child.exitCode === null && child.signalCode === null) { const exited = once(child, 'exit'); child.kill(); await exited; }
  }));
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true });
});

describe('independent application processes', () => {
  it('releases two armed contenders and commits exactly one booking and customer', async () => {
    const path = setup();
    const [first, second] = await Promise.all([start(path), start(path)]);
    const armed = [receive(first.child, 'armed'), receive(second.child, 'armed')];
    first.child.send({ type: 'book' }); second.child.send({ type: 'book' });
    await Promise.all(armed);
    const results = [receive(first.child, 'result'), receive(second.child, 'result')];
    first.child.send({ type: 'go', payload }); second.child.send({ type: 'go', payload: { ...payload, customer: { name: 'Other', phone: '67890' } } });
    const responses = await Promise.all(results);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(responses.find((r) => r.status === 409)?.body).toMatchObject({ error: { code: 'SLOT_UNAVAILABLE' } });
    const database = openDatabase(path);
    try {
      expect(database.prepare('SELECT COUNT(*) n FROM appointments').get()).toEqual({ n: 1 });
      expect(database.prepare('SELECT COUNT(*) n FROM customers').get()).toEqual({ n: 1 });
    } finally { database.close(); }
    await Promise.all([stop(first.child), stop(second.child)]);
  });

  it('preserves customer, appointment, session and blocked interval after clean application restart', async () => {
    const path = setup();
    const first = await start(path);
    const booking = await fetch(`${first.url}/api/appointments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    expect(booking.status).toBe(201);
    const created = await booking.json() as { data: { appointment: { id: string } } };
    const login = await fetch(`${first.url}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' }, body: JSON.stringify({ username: 'admin', password: 'password' }) });
    expect(login.status).toBe(204);
    const cookie = login.headers.get('set-cookie')?.split(';')[0];
    if (!cookie) throw new Error('Login omitted session cookie');
    await stop(first.child);
    const second = await start(path);
    const list = await fetch(`${second.url}/api/admin/appointments`, { headers: { Cookie: cookie } });
    expect(list.status).toBe(200);
    const body = await list.json() as { data: { appointments: unknown[] } };
    expect(body.data.appointments).toHaveLength(1);
    expect(body.data.appointments[0]).toMatchObject({ id: created.data.appointment.id, status: 'PENDING', startAt: payload.startAt, customer: payload.customer });
    const conflict = await fetch(`${second.url}/api/appointments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    expect(conflict.status).toBe(409);
    await stop(second.child);
  });
});
