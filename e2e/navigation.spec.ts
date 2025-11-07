import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/home');
  });

  test('should navigate to home page', async ({ page }) => {
    const homeLink = page.getByRole('link', { name: /home/i });
    await homeLink.click();
    await expect(page).toHaveURL(/.*home/);
  });

  test('should navigate to resume page', async ({ page }) => {
    const resumeLink = page.getByRole('link', { name: /resume/i });
    await resumeLink.click();
    await expect(page).toHaveURL(/.*resume/);
  });

  test('should navigate to projects page', async ({ page }) => {
    const projectsLink = page.getByRole('link', { name: /projects/i });
    await projectsLink.click();
    await expect(page).toHaveURL(/.*projects/);
  });

  test('should navigate to articles page', async ({ page }) => {
    const articlesLink = page.getByRole('link', { name: /articles/i });
    await articlesLink.click();
    await expect(page).toHaveURL(/.*articles/);
  });

  test('should show login button when not authenticated', async ({ page }) => {
    const loginButton = page.getByRole('button', { name: /login/i });
    await expect(loginButton).toBeVisible();
  });
});

