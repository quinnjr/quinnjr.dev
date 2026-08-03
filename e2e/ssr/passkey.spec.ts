import { test, expect, type CDPSession, type Page } from '@playwright/test';

/**
 * End-to-end proof of the passkey second factor, driven by Chrome's WebAuthn
 * virtual authenticator over CDP.
 *
 * There is no way to present a real authenticator from a test, and mocking the
 * browser API would only prove the mock works — the virtual authenticator runs
 * the genuine ceremony, so the attestation and assertion the server verifies
 * here are real ones.
 *
 * Requires an SSR server with a database and a seeded admin user:
 *
 *   docker start quinnjr-dev-db
 *   pnpm build
 *   DATABASE_URL=... WEBAUTHN_RP_ID=localhost \
 *     WEBAUTHN_ORIGIN=http://localhost:4321 PORT=4321 \
 *     node dist/quinnjr.dev/server/server.mjs &
 *   PLAYWRIGHT_SSR_BASE_URL=http://localhost:4321 \
 *     ADMIN_EMAIL=... ADMIN_PASSWORD=... \
 *     pnpm exec playwright test --project=ssr-routes passkey
 */

const EMAIL = process.env['ADMIN_EMAIL'];
const PASSWORD = process.env['ADMIN_PASSWORD'];

test.skip(
  !process.env['PLAYWRIGHT_SSR_BASE_URL'] || !EMAIL || !PASSWORD,
  'Needs a running SSR server plus ADMIN_EMAIL / ADMIN_PASSWORD.'
);

/** Attaches a virtual authenticator that auto-consents, standing in for a
 *  platform authenticator with user verification. */
async function attachAuthenticator(page: Page): Promise<CDPSession> {
  const client = await page.context().newCDPSession(page);
  await client.send('WebAuthn.enable', { enableUI: false });
  await client.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      ctap2Version: 'ctap2_1',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  return client;
}

async function submitPassword(page: Page): Promise<void> {
  await page.goto('/login');
  await page.waitForSelector('app-root', { state: 'attached' });
  await page.locator('input[type=email]').fill(EMAIL!);
  await page.locator('input[type=password]').fill(PASSWORD!);
  await page.getByRole('button', { name: /enter/i }).click();
}

test.describe('passkey second factor', () => {
  test('enrols a passkey, then requires it on the next sign-in', async ({ page }) => {
    await attachAuthenticator(page);

    // 1. With no passkey enrolled the password alone still signs in.
    await submitPassword(page);
    await page.waitForURL(/\/admin/, { timeout: 15000 });

    // 2. Enrol one from the admin security page.
    await page.goto('/admin/security');
    await page.waitForSelector('[data-testid="passkey-add"]');
    await expect(page.locator('[data-testid="passkey-empty"]')).toBeVisible();
    await page.locator('input[name="passkeyName"]').fill('Virtual key');
    await page.locator('[data-testid="passkey-add"]').click();
    await expect(page.locator('[data-testid="passkey-list"]')).toContainText('Virtual key', {
      timeout: 15000,
    });

    // 3. Sign out, then sign in again — the password must no longer be enough.
    await page.evaluate(() => localStorage.clear());
    await submitPassword(page);

    const passkeyStage = page.locator('[data-testid="passkey-stage"]');
    await expect(passkeyStage).toBeVisible({ timeout: 15000 });
    expect(page.url()).toContain('/login');

    // 4. Present the passkey and land in the admin area.
    await page.locator('[data-testid="passkey-continue"]').click();
    await page.waitForURL(/\/admin/, { timeout: 15000 });

    // 5. Clean up so the run is repeatable.
    await page.goto('/admin/security');
    await page
      .getByRole('button', { name: /remove/i })
      .first()
      .click();
    await expect(page.locator('[data-testid="passkey-empty"]')).toBeVisible({ timeout: 15000 });
  });

  test('a correct password alone does not reach the admin area once enrolled', async ({ page }) => {
    await attachAuthenticator(page);

    await submitPassword(page);
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    await page.goto('/admin/security');
    await page.locator('input[name="passkeyName"]').fill('Gate key');
    await page.locator('[data-testid="passkey-add"]').click();
    await expect(page.locator('[data-testid="passkey-list"]')).toContainText('Gate key', {
      timeout: 15000,
    });

    await page.evaluate(() => localStorage.clear());
    await submitPassword(page);
    await expect(page.locator('[data-testid="passkey-stage"]')).toBeVisible({ timeout: 15000 });

    // Navigating straight at the admin area with only the first factor done
    // must bounce back to the gate.
    await page.goto('/admin');
    await page.waitForURL(/\/login/, { timeout: 15000 });

    // Clean up.
    await submitPassword(page);
    await page.locator('[data-testid="passkey-continue"]').click();
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    await page.goto('/admin/security');
    await page
      .getByRole('button', { name: /remove/i })
      .first()
      .click();
    await expect(page.locator('[data-testid="passkey-empty"]')).toBeVisible({ timeout: 15000 });
  });
});
