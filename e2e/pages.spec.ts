import { test, expect } from '@playwright/test';

test.describe('Page Navigation', () => {
  test('should load resume page', async ({ page }) => {
    await page.goto('/resume');
    await page.waitForSelector('router-outlet, app-root', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForURL(/.*resume/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*resume/);
  });

  test('should load projects page', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForSelector('router-outlet, app-root', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForURL(/.*projects/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*projects/);
  });

  test('should load articles page', async ({ page }) => {
    await page.goto('/articles');
    await page.waitForSelector('router-outlet, app-root', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForURL(/.*articles/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*articles/);
  });

  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('router-outlet, app-root', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForURL(/.*login/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*login/);
  });
});
