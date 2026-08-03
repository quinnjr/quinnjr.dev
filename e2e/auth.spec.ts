import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should redirect to login when accessing protected admin route', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    // Auth guard redirects to the local login route. There is no external IdP:
    // auth is local email/password (argon2id) + a self-signed HS256 JWT.
    await page.waitForURL(/.*\/login/, { timeout: 15000 });
    expect(page.url()).not.toContain('/admin');
  });

  test('should show the login form', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('app-root', { state: 'attached', timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // `body` is visible on every non-blank page, 404s included — assert the
    // actual credential form instead.
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('form button[type="submit"]')).toBeVisible();
  });
});
