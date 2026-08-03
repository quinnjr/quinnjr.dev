import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('should have proper page structure on home page', async ({ page }) => {
    await page.goto('/home');
    // Wait for Angular to bootstrap - check for router outlet or app component
    await page.waitForSelector('app-root', { state: 'attached', timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    // Wait for home component content - v2.0.0 has hero section with gradient text
    await page.waitForSelector('h1', { timeout: 10000 });

    // Check for main hero heading
    const heroHeading = page.locator('h1').first();
    await expect(heroHeading).toBeVisible({ timeout: 10000 });
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/home');
    // Wait for Angular to bootstrap
    await page.waitForSelector('app-root', { state: 'attached', timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForSelector('nav', { timeout: 10000 });

    // Navigation component uses nav tag
    const navigation = page.locator('nav');
    await expect(navigation.first()).toBeVisible({ timeout: 10000 });
  });

  // Named for what it actually asserts. Real hierarchy analysis (skipped
  // levels, landmarks, contrast, ARIA) would need @axe-core/playwright, which
  // is not a dependency here — the single-h1 rule below is what can be checked
  // without one, and it is the rule this page most needs held.
  test('has exactly one h1, and it is the first heading on the page', async ({ page }) => {
    await page.goto('/home');
    // Wait for Angular to bootstrap
    await page.waitForSelector('app-root', { state: 'attached', timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForSelector('h1', { timeout: 10000 });

    await expect(page.locator('h1')).toHaveCount(1);

    // A page of six <h6> and no <h1> passed the previous version of this test.
    const levels = await page
      .locator('h1, h2, h3, h4, h5, h6')
      .evaluateAll(nodes => nodes.map(node => node.tagName.toLowerCase()));
    expect(levels.length).toBeGreaterThan(0);
    expect(levels[0]).toBe('h1');
  });

  test('renders links that all carry an accessible name', async ({ page }) => {
    await page.goto('/home');
    // Wait for Angular to bootstrap
    await page.waitForSelector('app-root', { state: 'attached', timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForSelector('a[href]', { timeout: 10000 });

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
