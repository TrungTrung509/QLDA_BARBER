# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> protected management dashboard >> lists, filters, and updates a Pending appointment using keyboard
- Location: e2e/dashboard.spec.ts:11:3

# Error details

```
Test timeout of 15000ms exceeded.
```

```
Error: locator.fill: Test timeout of 15000ms exceeded.
Call log:
  - waiting for getByLabel('Username')

```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | const apiUrl = process.env.E2E_API_URL ?? 'http://127.0.0.1:3001/api';
  3  | 
  4  | test.describe('protected management dashboard', () => {
  5  |   test('shows sign in without exposing customer appointments to anonymous visitors', async ({ page }) => {
  6  |     await page.goto('/admin');
  7  |     await expect(page.getByRole('heading', { name: 'Management sign in' })).toBeVisible();
  8  |     await expect(page.locator('.appointment-card')).toHaveCount(0);
  9  |   });
  10 | 
  11 |   test('lists, filters, and updates a Pending appointment using keyboard', async ({ page, request }, info) => {
  12 |     const username = process.env.E2E_ADMIN_USERNAME;
  13 |     const password = process.env.E2E_ADMIN_PASSWORD;
  14 |     if (!username || !password) throw new Error('Disposable E2E admin credentials are required');
  15 |     const startAt = info.project.name.includes('mobile') ? '2030-07-09T11:00:00.000Z' : '2030-07-08T11:00:00.000Z';
  16 |     const booking = await request.post(`${apiUrl}/appointments`, { data: { serviceId: 'service-classic', barberId: 'barber-alex', startAt, customer: { name: 'QA Dashboard', phone: '+12025550123' } } });
  17 |     expect(booking.status()).toBe(201);
  18 |     const body = await booking.json() as { data: { appointment: { id: string } } };
  19 |     await page.goto('/admin');
> 20 |     await page.getByLabel('Username').fill(username);
     |                                       ^ Error: locator.fill: Test timeout of 15000ms exceeded.
  21 |     await page.getByLabel('Password').fill(password);
  22 |     await page.getByRole('button', { name: 'Sign in', exact: true }).press('Enter');
  23 |     await page.getByLabel('Status', { exact: true }).selectOption('PENDING');
  24 |     const card = page.locator('.appointment-card').filter({ hasText: body.data.appointment.id });
  25 |     await expect(card).toContainText('PENDING');
  26 |     await page.getByLabel('Status', { exact: true }).press('Tab');
  27 |     const complete = card.getByRole('button', { name: 'Mark completed' });
  28 |     for (let i = 0; i < 100; i++) {
  29 |       if (await complete.evaluate((element) => element === document.activeElement)) break;
  30 |       await page.keyboard.press('Tab');
  31 |     }
  32 |     await expect(complete).toBeFocused();
  33 |     await page.keyboard.press('Enter');
  34 |     await expect(card).toHaveCount(0);
  35 |     await page.getByLabel('Status', { exact: true }).selectOption('COMPLETED');
  36 |     await expect(page.locator('.appointment-card').filter({ hasText: body.data.appointment.id })).toContainText('COMPLETED');
  37 |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  38 |     await info.attach('dashboard', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  39 |   });
  40 | });
  41 | 
```