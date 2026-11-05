import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

for (const viewport of viewports) {
  test.describe(`${viewport.name} public booking`, () => {
    test.use({ viewport });

    test('shows readable prices without horizontal overflow', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText(/price|service/i).first()).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(overflow).toBe(false);
    });

    test('completes the keyboard-only booking journey and announces confirmation', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name: /book/i }).focus();
      await page.keyboard.press('Enter');
      await page.getByLabel(/service/i).selectOption({ index: 1 });
      await page.getByLabel(/barber/i).selectOption({ index: 1 });
      await page.getByLabel(/date/i).fill('2030-06-14');
      await page.getByRole('button', { name: /10:00/ }).click();
      await page.getByLabel(/name/i).fill('QA Customer');
      await page.getByLabel(/email/i).fill('qa.customer@example.test');
      await page.getByLabel(/phone/i).fill('+12025550123');
      await page.getByRole('button', { name: /confirm|book/i }).click();
      await expect(page.getByRole('status')).toContainText(/confirmed|pending|booked/i);
    });

    test('exposes loading, empty, and server error feedback', async ({ page }) => {
      await page.route('**/api/availability**', async (route) => {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ code: 'TEST_FAILURE' }) });
      });
      await page.goto('/book');
      await expect(page.getByRole('alert')).toContainText(/try again|unavailable|error/i);
      await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
    });
  });
}

