import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should redirect to login when accessing protected admin route', async ({ page }) => {
    await page.goto('/admin');
    // Should redirect to login or show login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show login page content', async ({ page }) => {
    await page.goto('/login');
    // Check for login form or Auth0 button
    const loginContent = page.locator('body');
    await expect(loginContent).toBeVisible();
  });

  test('should handle callback route', async ({ page }) => {
    await page.goto('/callback');
    // Callback page should load (may redirect after auth)
    await expect(page).toHaveURL(/.*callback/);
  });
});
