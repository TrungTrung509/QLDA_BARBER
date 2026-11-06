import { waitForApi } from './readiness';
import { expect, test } from '@playwright/test';
const apiUrl = process.env.E2E_API_URL ?? 'http://127.0.0.1:3001/api';

test.describe('protected management dashboard', () => {
  test('shows sign in without exposing customer appointments to anonymous visitors', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Management sign in' })).toBeVisible();
    await expect(page.locator('.appointment-card')).toHaveCount(0);
  });

  test('lists, filters, and updates a Pending appointment using keyboard', async ({ page, request }, info) => {
    const username = process.env.E2E_ADMIN_USERNAME;
    const password = process.env.E2E_ADMIN_PASSWORD;
    if (!username || !password) throw new Error('Disposable E2E admin credentials are required');
    const startAt = info.project.name.includes('mobile') ? '2030-07-09T11:00:00.000Z' : '2030-07-08T11:00:00.000Z';
    const booking = await request.post(`${apiUrl}/appointments`, { data: { serviceId: 'service-classic', barberId: 'barber-alex', startAt, customer: { name: 'QA Dashboard', phone: '+12025550123' } } });
    expect(booking.status()).toBe(201);
    const body = await booking.json() as { data: { appointment: { id: string } } };
    await page.goto('/admin');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).press('Enter');
    await page.getByLabel('Status', { exact: true }).selectOption('PENDING');
    const card = page.locator('.appointment-card').filter({ hasText: body.data.appointment.id });
    await expect(card).toContainText('PENDING');
    await page.getByLabel('Status', { exact: true }).press('Tab');
    const complete = card.getByRole('button', { name: 'Mark completed' });
    for (let i = 0; i < 100; i++) {
      if (await complete.evaluate((element) => element === document.activeElement)) break;
      await page.keyboard.press('Tab');
    }
    await expect(complete).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(card).toHaveCount(0);
    await page.getByLabel('Status', { exact: true }).selectOption('COMPLETED');
    await expect(page.locator('.appointment-card').filter({ hasText: body.data.appointment.id })).toContainText('COMPLETED');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await info.attach('dashboard', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });
});

test.beforeEach(async ({ request }) => { await waitForApi(request); });
