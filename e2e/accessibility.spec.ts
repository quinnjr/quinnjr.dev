import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('should have proper page structure on home page', async ({ page }) => {
    await page.goto('/home');

    // Check for main content area
    const mainContent = page.locator('main, [role="main"], app-home');
    await expect(mainContent.first()).toBeVisible();
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/home');

    const navigation = page.locator('nav, [role="navigation"], app-navigation');
    await expect(navigation.first()).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/home');

    // Check if at least one heading exists
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    await expect(headings.first()).toBeVisible();
  });

  test('should have accessible links', async ({ page }) => {
    await page.goto('/home');

    const links = page.getByRole('link');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    // Check that links have accessible names
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });
});
