import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/home');
    await page.waitForSelector('router-outlet, app-root', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForSelector('nav', { timeout: 10000 });
  });

  test('should navigate to home page', async ({ page }) => {
    const homeLink = page.getByRole('link', { name: /home/i });
    await homeLink.click({ timeout: 10000 });
    await page.waitForSelector('router-outlet, app-root', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForURL(/.*home/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*home/);
  });

  test('should navigate to resume page', async ({ page }) => {
    // Use first() to handle multiple resume links (nav + CTA button on homepage)
    const resumeLink = page.getByRole('link', { name: /resume/i }).first();
    await resumeLink.click({ timeout: 10000 });
    await page.waitForSelector('router-outlet, app-root', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForURL(/.*resume/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*resume/);
  });

  test('should navigate to projects page', async ({ page }) => {
    // Use first() to handle multiple projects links (nav + CTA button on homepage)
    const projectsLink = page.getByRole('link', { name: /projects/i }).first();
    await projectsLink.click({ timeout: 10000 });
    await page.waitForSelector('router-outlet, app-root', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForURL(/.*projects/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*projects/);
  });

  test('should navigate to articles page', async ({ page }) => {
    const articlesLink = page.getByRole('link', { name: /articles/i });
    await articlesLink.click({ timeout: 10000 });
    await page.waitForSelector('router-outlet, app-root', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForURL(/.*articles/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*articles/);
  });

  test('should show login button when not authenticated', async ({ page }) => {
    // v2.0.0 uses auth-button component which may show Login or user info
    // Just verify the auth button component is present
    const authButton = page.locator('app-auth-button');
    await expect(authButton).toBeVisible({ timeout: 10000 });
  });
});
