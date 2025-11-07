import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/.*home/);
  });

  test('should display page title', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveTitle(/quinnjr\.dev/i);
  });

  test('should have navigation visible', async ({ page }) => {
    await page.goto('/home');
    const navigation = page.locator('app-navigation');
    await expect(navigation).toBeVisible();
  });

  test('should redirect root path to home', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*home/);
  });
});

