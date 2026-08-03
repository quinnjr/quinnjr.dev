import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/home');
    await page.waitForSelector('app-root', { state: 'attached', timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForURL(/.*home/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*home/);
    // `app-root` is in the served HTML before Angular boots, so a URL-only
    // assertion passes even when the component throws and renders nothing.
    await expect(page.locator('h1.hero-name')).toContainText('Joseph R. Quinn');
  });

  test('should display page title', async ({ page }) => {
    await page.goto('/home');
    await page.waitForSelector('app-root', { state: 'attached', timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    // Set per-route by SeoService, not by index.html — see seo.service.ts.
    await expect(page).toHaveTitle(/Joseph R\. Quinn.*Software Engineer/i, {
      timeout: 10000,
    });
  });

  test('should carry a page-specific canonical URL', async ({ page }) => {
    await page.goto('/resume');
    await page.waitForSelector('app-root', { state: 'attached', timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
    await expect(canonical).toHaveAttribute('href', 'https://quinnjr.dev/resume');
  });

  test('should have navigation visible', async ({ page }) => {
    await page.goto('/home');
    await page.waitForSelector('app-root', { state: 'attached', timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForSelector('nav', { timeout: 10000 });
    // Note: component selector is app-naviation (typo in component)
    const navigation = page.locator('nav');
    await expect(navigation.first()).toBeVisible({ timeout: 10000 });
  });

  test('should redirect root path to home', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('app-root', { state: 'attached', timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForURL(/.*home/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*home/);
  });
});
