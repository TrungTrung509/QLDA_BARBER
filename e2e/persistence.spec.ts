import { expect, test } from '@playwright/test';
import { spawn, execFileSync, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';

test('persists customer and appointment across clean application process restart', async ({ playwright }) => {
  test.setTimeout(40000);
  const directory = mkdtempSync(join(tmpdir(), 'bbs6-restart-'));
  const env = { ...process.env, DATABASE_PATH: join(directory, 'qa.sqlite'), API_PORT: '0', ADMIN_USERNAME: 'qa-restart', ADMIN_PASSWORD: randomBytes(24).toString('hex'), ALLOWED_ORIGIN: 'http://127.0.0.1:5173' };
  let child: ChildProcess | undefined;
  async function start(): Promise<string> {
    child = spawn(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', "import {startServer} from './apps/api/src/server.ts';const s=startServer();s.on('listening',()=>console.log('QA_PORT='+s.address().port));"], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    const current = child;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { reject(new Error('Restart server readiness timeout')); }, 10000);
      current.stdout?.on('data', (chunk: Buffer) => {
        const match = /QA_PORT=(\d+)/.exec(chunk.toString());
        if (match?.[1]) { clearTimeout(timer); resolve(`http://127.0.0.1:${match[1]}`); }
      });
      current.once('exit', (code) => { clearTimeout(timer); reject(new Error(`Server exited before readiness: ${String(code)}`)); });
    });
  }
  async function stop(): Promise<void> {
    if (!child) return;
    const exited = once(child, 'exit'); child.kill('SIGTERM');
    const result: unknown[] = await exited;
    expect(result[0]).toBe(0); child = undefined;
  }
  const context = await playwright.request.newContext();
  try {
    execFileSync(process.execPath, ['--import', 'tsx', 'apps/api/src/db/seed.ts'], { env, stdio: 'pipe' });
    const first = await start();
    const input = { serviceId: 'service-classic', barberId: 'barber-alex', startAt: '2030-07-10T11:00:00.000Z', customer: { name: 'QA Persistent', phone: '+12025550123' } };
    const created = await context.post(`${first}/api/appointments`, { data: input });
    expect(created.status()).toBe(201);
    const body = await created.json() as { data: { appointment: { id: string } } };
    await stop();
    const second = await start();
    const login = await context.post(`${second}/api/auth/login`, { headers: { origin: env.ALLOWED_ORIGIN }, data: { username: env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD } });
    expect(login.status()).toBe(204);
    const listing = await context.get(`${second}/api/admin/appointments`);
    expect(listing.status()).toBe(200);
    await expect(listing.json()).resolves.toMatchObject({ data: { appointments: [ { id: body.data.appointment.id, customer: input.customer, status: 'PENDING' } ] } });
    const overlap = await context.post(`${second}/api/appointments`, { data: input });
    expect(overlap.status()).toBe(409);
    await stop();
  } finally {
    if (child?.exitCode === null) { const exited = once(child, 'exit'); child.kill('SIGTERM'); await exited; }
    await context.dispose(); rmSync(directory, { recursive: true, force: true });
  }
});
