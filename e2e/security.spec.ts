import { waitForApi } from './readiness';
import { expect, test } from '@playwright/test';

const apiUrl = process.env.E2E_API_URL ?? 'http://127.0.0.1:3001/api';

test.describe('management authorization and input validation', () => {
  test('rejects anonymous and invalid sessions without leaking customer data', async ({ request }) => {
    const anonymous = await request.get(`${apiUrl}/admin/appointments`);
    expect([401, 403]).toContain(anonymous.status());
    expect(await anonymous.text()).not.toMatch(/qa\.customer@example\.test|\+12025550123/i);

    const invalid = await request.get(`${apiUrl}/admin/appointments`, {
      headers: { authorization: 'Bearer invalid-test-token' },
    });
    expect([401, 403]).toContain(invalid.status());
  });

  test('rejects malformed booking input with a safe client error', async ({ request }) => {
    const response = await request.post(`${apiUrl}/appointments`, {
      data: { serviceId: {}, barberId: '../admin', date: 'not-a-date', time: '99:99', customer: null },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
    expect(await response.text()).not.toMatch(/stack|password|secret|sqlite|node_modules/i);
  });

  test('does not allow anonymous status transitions', async ({ request }) => {
    const response = await request.patch(`${apiUrl}/admin/appointments/nonexistent/status`, {
      data: { status: 'Completed' },
    });
    expect([401, 403]).toContain(response.status());
  });

  test('rejects a cross-origin cookie-authenticated mutation', async ({ request }) => {
    const username = process.env.E2E_ADMIN_USERNAME;
    const password = process.env.E2E_ADMIN_PASSWORD;
    test.skip(!username || !password, 'E2E admin credentials are required');
    const login = await request.post(`${apiUrl}/auth/login`, { headers: { origin: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173' }, data: { username, password } });
    expect(login.status()).toBe(204);

    const response = await request.patch(`${apiUrl}/admin/appointments/nonexistent/status`, {
      headers: { origin: 'https://attacker.example.test' },
      data: { status: 'CANCELLED' },
    });
    expect(response.status()).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'FORBIDDEN' } });
  });
});


test.beforeEach(async ({ request }) => { await waitForApi(request); });
