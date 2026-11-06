# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking-flow.spec.ts >> mobile public booking >> completes each booking step using keyboard and checks overflow
- Location: e2e/booking-flow.spec.ts:46:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Services & prices' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Services & prices' }) with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Services & prices' })

```

# Test source

```ts
  1   | import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
  2   | 
  3   | /** Reach a control using only Tab, preserving real keyboard navigation. */
  4   | async function reach(page: Page, target: Locator): Promise<void> {
  5   |   for (let attempt = 0; attempt < 100; attempt++) {
  6   |     if (await target.evaluate((element) => element === document.activeElement)) return;
  7   |     await page.keyboard.press('Tab');
  8   |   }
  9   |   throw new Error('Control could not be reached with Tab');
  10  | }
  11  | async function activate(page: Page, target: Locator): Promise<void> {
  12  |   await reach(page, target);
  13  |   await page.keyboard.press('Enter');
  14  | }
  15  | async function capture(page: Page, info: TestInfo, step: string): Promise<void> {
  16  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  17  |   await info.attach(step, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  18  | }
  19  | async function selectDate(page: Page, date: string): Promise<void> {
  20  |   const input = page.getByLabel('Appointment date');
  21  |   await reach(page, input);
  22  |   // Chromium date inputs expose month/day/year keyboard segments.
  23  |   const [year, month, day] = date.split('-');
  24  |   if (!year || !month || !day) throw new Error('Invalid QA date');
  25  |   await page.keyboard.press('ArrowLeft');
  26  |   await page.keyboard.press('ArrowLeft');
  27  |   await page.keyboard.type(month);
  28  |   await page.keyboard.press('ArrowRight');
  29  |   await page.keyboard.type(day);
  30  |   await page.keyboard.press('ArrowRight');
  31  |   await page.keyboard.type(year);
  32  |   await expect(input).toHaveValue(date);
  33  | }
  34  | async function enterFlow(page: Page, date: string): Promise<void> {
  35  |   await page.goto('/');
  36  |   await activate(page, page.getByRole('button', { name: 'Choose Classic Cut', exact: true }));
  37  |   const barber = page.getByRole('radio', { name: 'Alex', exact: true });
  38  |   await reach(page, barber); await page.keyboard.press('Space');
  39  |   await activate(page, page.getByRole('button', { name: 'Continue', exact: true }));
  40  |   await selectDate(page, date);
  41  | }
  42  | 
  43  | for (const viewport of [{ name: 'mobile', width: 375, height: 812 }, { name: 'desktop', width: 1440, height: 900 }] as const) {
  44  |   test.describe(`${viewport.name} public booking`, () => {
  45  |     test.use({ viewport });
  46  |     test('completes each booking step using keyboard and checks overflow', async ({ page }, info) => {
  47  |       const day = 17 + (info.project.name.includes('mobile') ? 7 : 0) + (viewport.name === 'desktop' ? 1 : 0);
  48  |       const date = `2030-06-${String(day)}`;
  49  |       await page.goto('/');
> 50  |       await expect(page.getByRole('heading', { name: 'Services & prices' })).toBeVisible();
      |                                                                              ^ Error: expect(locator).toBeVisible() failed
  51  |       await capture(page, info, 'service');
  52  |       await activate(page, page.getByRole('button', { name: 'Choose Classic Cut', exact: true }));
  53  |       await expect(page.getByRole('radio', { name: 'Alex', exact: true })).toBeVisible();
  54  |       await capture(page, info, 'barber');
  55  |       await reach(page, page.getByRole('radio', { name: 'Alex', exact: true })); await page.keyboard.press('Space');
  56  |       await activate(page, page.getByRole('button', { name: 'Continue', exact: true }));
  57  |       await selectDate(page, date); await capture(page, info, 'date');
  58  |       await activate(page, page.getByRole('button', { name: 'Find times' }));
  59  |       const slot = page.getByRole('radio', { name: '10:00 AM', exact: true });
  60  |       await expect(slot).toBeVisible(); await capture(page, info, 'time');
  61  |       await reach(page, slot); await page.keyboard.press('Space');
  62  |       await activate(page, page.getByRole('button', { name: 'Continue', exact: true }));
  63  |       for (const [label, value] of [['Full name', 'QA Keyboard'], ['Phone', '+12025550123'], ['Email (optional)', 'qa.keyboard@example.test']] as const) {
  64  |         await reach(page, page.getByLabel(label, { exact: true })); await page.keyboard.type(value);
  65  |       }
  66  |       await capture(page, info, 'details');
  67  |       await activate(page, page.getByRole('button', { name: 'Confirm booking', exact: true }));
  68  |       await expect(page.getByRole('heading', { name: 'You’re booked' })).toBeVisible();
  69  |       await expect(page.locator('.notice.success')).toContainText(/pending/i);
  70  |       await capture(page, info, 'confirmation');
  71  |       // Check assistive-technology feedback separately from visual success.
  72  |       await expect(page.getByRole('status')).toContainText(/appointment|pending|booked/i);
  73  |     });
  74  | 
  75  |     test('shows loading, empty, and error feedback after requesting availability', async ({ page }, info) => {
  76  |       let outcome: 'loading' | 'empty' | 'error' = 'loading';
  77  |       let release: (() => void) | undefined;
  78  |       const gate = new Promise<void>((resolve) => { release = resolve; });
  79  |       await page.route('**/api/availability**', async (route) => {
  80  |         if (outcome === 'loading') await gate;
  81  |         await route.fulfill({ status: outcome === 'error' ? 500 : 200, contentType: 'application/json', body: JSON.stringify(outcome === 'error' ? { error: { code: 'INTERNAL_ERROR', message: 'QA availability failure' } } : { data: { timezone: 'UTC', slots: [] } }) });
  82  |       });
  83  |       try {
  84  |         await enterFlow(page, '2030-06-19');
  85  |         await activate(page, page.getByRole('button', { name: 'Find times' }));
  86  |         await expect(page.getByRole('status')).toContainText('Loading available times');
  87  |         await capture(page, info, 'loading');
  88  |         outcome = 'empty'; release?.();
  89  |         await expect(page.getByText('No times remain for this date.')).toBeVisible();
  90  |         await capture(page, info, 'empty');
  91  |         await activate(page, page.getByRole('button', { name: 'Choose another date' }));
  92  |         outcome = 'error';
  93  |         await activate(page, page.getByRole('button', { name: 'Find times' }));
  94  |         await expect(page.getByRole('alert')).toContainText(/could not load available times/i);
  95  |         await capture(page, info, 'error');
  96  |       } finally { release?.(); }
  97  |     });
  98  |   });
  99  | }
  100 | 
```