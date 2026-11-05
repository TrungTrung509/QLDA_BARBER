import { expect, test } from '@playwright/test';

test.describe('protected management dashboard', () => {
  test('redirects an anonymous visitor away from customer appointments', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/login/);
    await expect(page.getByText(/qa\.customer@example\.test|\+12025550123/i)).toHaveCount(0);
  });

  test('lists, filters, and updates a Pending appointment with keyboard controls', async ({ page }) => {
    const username = process.env.E2E_ADMIN_USERNAME;
    const password = process.env.E2E_ADMIN_PASSWORD;
    test.skip(!username || !password, 'E2E admin credentials are required');

    await page.goto('/admin/login');
    await page.getByLabel(/username|email/i).fill(username!);
    await page.getByLabel(/password/i).fill(password!);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.getByLabel(/status/i).selectOption('Pending');
    const row = page.getByRole('row').filter({ hasText: /Pending/i }).first();
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: /complete/i }).focus();
    await page.keyboard.press('Enter');
    await expect(row).toContainText(/Completed/i);
  });
});

