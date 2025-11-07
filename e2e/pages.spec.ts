import { test, expect } from '@playwright/test';

test.describe('Page Navigation', () => {
  test('should load resume page', async ({ page }) => {
    await page.goto('/resume');
    await expect(page).toHaveURL(/.*resume/);
  });

  test('should load projects page', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL(/.*projects/);
  });

  test('should load articles page', async ({ page }) => {
    await page.goto('/articles');
    await expect(page).toHaveURL(/.*articles/);
  });

  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login/);
  });
});
