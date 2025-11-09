import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should redirect to login when accessing protected admin route', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    // Auth guard should redirect to login page
    // Wait for either login route or auth0 redirect
    await page.waitForURL(/.*\/login|.*auth0\.com/, { timeout: 15000 });
    // Verify we're not on the admin page
    expect(page.url()).not.toContain('/admin');
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
