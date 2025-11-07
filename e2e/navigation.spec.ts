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
    const resumeLink = page.getByRole('link', { name: /resume/i });
    await resumeLink.click({ timeout: 10000 });
    await page.waitForSelector('router-outlet, app-root', { timeout: 15000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForURL(/.*resume/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*resume/);
  });

  test('should navigate to projects page', async ({ page }) => {
    const projectsLink = page.getByRole('link', { name: /projects/i });
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
    await page.waitForSelector('button', { timeout: 10000 });
    const loginButton = page.getByRole('button', { name: /login/i });
    await expect(loginButton).toBeVisible({ timeout: 10000 });
  });
});
