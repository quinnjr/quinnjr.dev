import { test, expect } from '@playwright/test';

/**
 * Each case asserts a real piece of rendered content on top of the URL check.
 * `expect(page).toHaveURL(...)` alone only restates the `goto` that preceded it,
 * so a page whose component threw in ngOnInit and rendered nothing still passed.
 */
test.describe('Page Navigation', () => {
  test('should load resume page', async ({ page }) => {
    await page.goto('/resume');
    await page.waitForSelector('app-root', { state: 'attached', timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForURL(/.*resume/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*resume/);
    await expect(page.locator('h1.char-name')).toContainText('Joseph R. Quinn', {
      timeout: 10000,
    });
  });

  test('should load projects page', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForSelector('app-root', { state: 'attached', timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForURL(/.*projects/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*projects/);
    await expect(page.getByRole('heading', { level: 1, name: 'Crafted Works' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should load articles page', async ({ page }) => {
    await page.goto('/articles');
    await page.waitForSelector('app-root', { state: 'attached', timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForURL(/.*articles/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*articles/);
    await expect(page.getByRole('heading', { level: 1, name: 'Chronicles' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('app-root', { state: 'attached', timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForURL(/.*login/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('heading', { level: 1, name: 'The Gatehouse' })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
