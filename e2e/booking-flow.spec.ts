import { waitForApi } from './readiness';
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';

/** Reach a control using only Tab, preserving real keyboard navigation. */
async function reach(page: Page, target: Locator): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error('Control could not be reached with Tab');
}
async function activate(page: Page, target: Locator): Promise<void> {
  await reach(page, target);
  await page.keyboard.press('Enter');
}
async function capture(page: Page, info: TestInfo, step: string): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await info.attach(step, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
}
async function selectDate(page: Page, date: string): Promise<void> {
  const input = page.getByLabel('Appointment date');
  await reach(page, input);
  // Chromium date inputs expose month/day/year keyboard segments.
  const [year, month, day] = date.split('-');
  if (!year || !month || !day) throw new Error('Invalid QA date');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.type(month);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.type(day);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.type(year);
  await expect(input).toHaveValue(date);
}
async function enterFlow(page: Page, date: string): Promise<void> {
  await page.goto('/');
  await activate(page, page.getByRole('button', { name: 'Choose Classic Cut', exact: true }));
  const barber = page.getByRole('radio', { name: 'Alex', exact: true });
  await reach(page, barber); await page.keyboard.press('Space');
  await activate(page, page.getByRole('button', { name: 'Continue', exact: true }));
  await selectDate(page, date);
}

for (const viewport of [{ name: 'mobile', width: 375, height: 812 }, { name: 'desktop', width: 1440, height: 900 }] as const) {
  test.describe(`${viewport.name} public booking`, () => {
    test.use({ viewport });
    test('completes each booking step using keyboard and checks overflow', async ({ page }, info) => {
      const day = 17 + (info.project.name.includes('mobile') ? 7 : 0) + (viewport.name === 'desktop' ? 1 : 0);
      const date = `2030-06-${String(day)}`;
      await page.goto('/');
      await expect(page.getByRole('heading', { name: 'Services & prices' })).toBeVisible();
      await capture(page, info, 'service');
      await activate(page, page.getByRole('button', { name: 'Choose Classic Cut', exact: true }));
      await expect(page.getByRole('radio', { name: 'Alex', exact: true })).toBeVisible();
      await capture(page, info, 'barber');
      await reach(page, page.getByRole('radio', { name: 'Alex', exact: true })); await page.keyboard.press('Space');
      await activate(page, page.getByRole('button', { name: 'Continue', exact: true }));
      await selectDate(page, date); await capture(page, info, 'date');
      await activate(page, page.getByRole('button', { name: 'Find times' }));
      const slot = page.getByRole('radio', { name: '10:00 AM', exact: true });
      await expect(slot).toBeVisible(); await capture(page, info, 'time');
      await reach(page, slot); await page.keyboard.press('Space');
      await activate(page, page.getByRole('button', { name: 'Continue', exact: true }));
      for (const [label, value] of [['Full name', 'QA Keyboard'], ['Phone', '+12025550123'], ['Email (optional)', 'qa.keyboard@example.test']] as const) {
        await reach(page, page.getByLabel(label, { exact: true })); await page.keyboard.type(value);
      }
      await capture(page, info, 'details');
      await activate(page, page.getByRole('button', { name: 'Confirm booking', exact: true }));
      await expect(page.getByRole('heading', { name: 'You’re booked' })).toBeVisible();
      await expect(page.locator('.notice.success')).toContainText(/pending/i);
      await capture(page, info, 'confirmation');
      // Check assistive-technology feedback separately from visual success.
      await expect(page.getByRole('status')).toContainText(/appointment|pending|booked/i);
    });

    test('shows loading, empty, and error feedback after requesting availability', async ({ page }, info) => {
      let outcome: 'loading' | 'empty' | 'error' = 'loading';
      let release: (() => void) | undefined;
      const gate = new Promise<void>((resolve) => { release = resolve; });
      await page.route('**/api/availability**', async (route) => {
        if (outcome === 'loading') await gate;
        await route.fulfill({ status: outcome === 'error' ? 500 : 200, contentType: 'application/json', body: JSON.stringify(outcome === 'error' ? { error: { code: 'INTERNAL_ERROR', message: 'QA availability failure' } } : { data: { timezone: 'UTC', slots: [] } }) });
      });
      try {
        await enterFlow(page, '2030-06-19');
        await activate(page, page.getByRole('button', { name: 'Find times' }));
        await expect(page.getByRole('status')).toContainText('Loading available times');
        await capture(page, info, 'loading');
        outcome = 'empty'; release?.();
        await expect(page.getByText('No times remain for this date.')).toBeVisible();
        await capture(page, info, 'empty');
        await activate(page, page.getByRole('button', { name: 'Choose another date' }));
        outcome = 'error';
        await activate(page, page.getByRole('button', { name: 'Find times' }));
        await expect(page.getByRole('alert')).toContainText(/could not load available times/i);
        await capture(page, info, 'error');
      } finally { release?.(); }
    });
  });
}

test.beforeEach(async ({ request }) => { await waitForApi(request); });
