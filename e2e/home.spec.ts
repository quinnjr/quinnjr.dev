import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/home');
    await page.waitForSelector('router-outlet, app-root', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForURL(/.*home/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*home/);
  });

  test('should display page title', async ({ page }) => {
    await page.goto('/home');
    await page.waitForSelector('router-outlet, app-root', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await expect(page).toHaveTitle(/quinnjr\.dev/i, { timeout: 10000 });
  });

  test('should have navigation visible', async ({ page }) => {
    await page.goto('/home');
    await page.waitForSelector('router-outlet, app-root', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForSelector('nav', { timeout: 10000 });
    // Note: component selector is app-naviation (typo in component)
    const navigation = page.locator('nav');
    await expect(navigation.first()).toBeVisible({ timeout: 10000 });
  });

  test('should redirect root path to home', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('router-outlet, app-root', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForURL(/.*home/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*home/);
  });
});
