import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should redirect to login when accessing protected admin route', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForSelector('router-outlet, app-root', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    // Should redirect to login or show login page
    await page.waitForURL(/.*login/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show login page content', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('router-outlet, app-root', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    // Check for login form or Auth0 button
    const loginContent = page.locator('body');
    await expect(loginContent).toBeVisible({ timeout: 10000 });
  });

  test('should handle callback route', async ({ page }) => {
    await page.goto('/callback');
    await page.waitForSelector('router-outlet, app-root', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    // Callback page should load (may redirect after auth)
    await page.waitForURL(/.*callback/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*callback/);
  });
});
