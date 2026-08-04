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
 * Requires an SSR server with a database and a seeded admin user.
 *
 * AUTH_RATE_LIMIT_OVERRIDES is not optional here. These cases sign the same
 * account in around eight times, and the shipped policy allows five logins per
 * email per fifteen minutes — so without it the run dies partway through, and
 * it dies looking like a credentials failure, because the login form reports
 * every error as "Invalid email or password". The server refuses the variable
 * outright under NODE_ENV=production.
 *
 *   docker start quinnjr-dev-db
 *   pnpm build
 *   DATABASE_URL=... WEBAUTHN_RP_ID=localhost \
 *     WEBAUTHN_ORIGIN=http://localhost:4321 PORT=4321 \
 *     AUTH_RATE_LIMIT_OVERRIDES='{"login":{"ipLimit":1000,"subjectLimit":1000}}' \
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

interface VirtualAuthenticator {
  client: CDPSession;
  /** Needed by getCredentials/addCredential, which are per-authenticator. */
  authenticatorId: string;
}

/** Attaches a virtual authenticator that auto-consents, standing in for a
 *  platform authenticator with user verification. */
async function attachAuthenticator(page: Page): Promise<VirtualAuthenticator> {
  const client = await page.context().newCDPSession(page);
  await client.send('WebAuthn.enable', { enableUI: false });
  const { authenticatorId } = await client.send('WebAuthn.addVirtualAuthenticator', {
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
  return { client, authenticatorId };
}

async function submitPassword(page: Page): Promise<void> {
  await page.goto('/login');
  await page.waitForSelector('app-root', { state: 'attached' });
  await page.locator('input[type=email]').fill(EMAIL!);
  await page.locator('input[type=password]').fill(PASSWORD!);
  await page.getByRole('button', { name: /enter/i }).click();
}

// Both cases enrol against the SAME seeded admin account and both begin by
// Both cases drive the SAME seeded admin account through enrolment and back,
// and each begins from a known credential state. Run in parallel (the default
// off CI) they race each other into failure, so this file is explicitly serial.
test.describe.configure({ mode: 'serial' });

/** Enrols a credential from the mandatory first-sign-in stage and lands in the
 *  admin area. Leaves the account with exactly one passkey. */
async function enrolFromLogin(page: Page, name: string): Promise<void> {
  await submitPassword(page);
  await expect(page.locator('[data-testid="enrol-stage"]')).toBeVisible({ timeout: 15000 });
  await page.locator('input[name="passkeyName"]').fill(name);
  await page.locator('[data-testid="enrol-continue"]').click();
  await page.waitForURL(/\/admin/, { timeout: 15000 });
}

/** Removes every credential, restoring the no-passkey state the next test
 *  expects. The last one needs the explicit confirmation. */
async function removeAllPasskeys(page: Page): Promise<void> {
  await page.goto('/admin/security');
  await page.waitForSelector('[data-testid="passkey-add"]');
  await page
    .getByRole('button', { name: /remove/i })
    .first()
    .click();
  const confirm = page.locator('[data-testid="passkey-remove-confirm-yes"]');
  const empty = page.locator('[data-testid="passkey-empty"]');
  // Only the last key raises the confirmation, so wait for whichever of the two
  // outcomes the click produces before deciding. `isVisible()` on its own does
  // not retry, and change detection is scheduled rather than synchronous, so
  // asking straight after the click reliably caught the DOM one frame early —
  // reporting "no dialog", skipping the confirm, and then timing out against an
  // empty state that the un-confirmed removal was never going to reach.
  await expect(confirm.or(empty).first()).toBeVisible({ timeout: 15000 });
  if (await confirm.isVisible()) {
    await confirm.click();
  }
  await expect(empty).toBeVisible({ timeout: 15000 });
}

test.describe('passkey second factor', () => {
  // A passkey is mandatory, so the very first sign-in on a credential-less
  // account must stop and enrol one rather than handing over the admin area.
  test('requires enrolment on a first sign-in, then requires the passkey after', async ({
    page,
  }) => {
    await attachAuthenticator(page);

    // 1. Password alone stops at enrolment — it does NOT reach /admin.
    await submitPassword(page);
    await expect(page.locator('[data-testid="enrol-stage"]')).toBeVisible({ timeout: 15000 });
    expect(page.url()).toContain('/login');

    // The half-finished sign-in must not be a session.
    await page.goto('/admin');
    await page.waitForURL(/\/login/, { timeout: 15000 });

    // 2. Enrol, which is the only way through.
    await enrolFromLogin(page, 'Virtual key');

    // 3. Sign out and back in — now it is an assertion, not an enrolment.
    await page.evaluate(() => localStorage.clear());
    await submitPassword(page);
    await expect(page.locator('[data-testid="passkey-stage"]')).toBeVisible({ timeout: 15000 });
    expect(page.url()).toContain('/login');

    await page.locator('[data-testid="passkey-continue"]').click();
    await page.waitForURL(/\/admin/, { timeout: 15000 });

    await removeAllPasskeys(page);
  });

  test('a correct password alone never reaches the admin area', async ({ page }) => {
    await attachAuthenticator(page);
    await enrolFromLogin(page, 'Gate key');

    await page.evaluate(() => localStorage.clear());
    await submitPassword(page);
    await expect(page.locator('[data-testid="passkey-stage"]')).toBeVisible({ timeout: 15000 });

    // Navigating straight at the admin area with only the first factor done
    // must bounce back to the gate.
    await page.goto('/admin');
    await page.waitForURL(/\/login/, { timeout: 15000 });

    await submitPassword(page);
    await page.locator('[data-testid="passkey-continue"]').click();
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    await removeAllPasskeys(page);
  });

  // Named for what it actually proves. `clearCredentials` makes
  // `navigator.credentials.get()` reject inside the page, so `verifyPasskey` is
  // very likely never sent and the visible error is the client's own catch
  // branch — these assertions would hold just as well if the server accepted
  // anything, or were down. That is worth testing, but it is a UI property.
  // The server-side counterpart is the test below it.
  test('the UI surfaces a failure when the authenticator cannot answer', async ({ page }) => {
    const { client, authenticatorId } = await attachAuthenticator(page);
    await enrolFromLogin(page, 'Doomed key');

    // Snapshot the credential before dropping it. Without this the account is
    // left holding a passkey row whose private key exists nowhere, and since
    // removing a passkey needs a session — which needs asserting that very
    // passkey — there is no route back. The suite would pass exactly once per
    // database and fail on every subsequent run at test 1's enrol stage.
    const { credentials } = (await client.send(
      'WebAuthn.getCredentials' as never,
      {
        authenticatorId,
      } as never
    )) as { credentials: unknown[] };
    expect(credentials.length).toBeGreaterThan(0);

    await page.evaluate(() => localStorage.clear());
    await client.send('WebAuthn.clearCredentials' as never, { authenticatorId } as never);

    await submitPassword(page);
    await expect(page.locator('[data-testid="passkey-stage"]')).toBeVisible({ timeout: 15000 });
    await page.locator('[data-testid="passkey-continue"]').click();

    await expect(page.locator('.login-error')).toBeVisible({ timeout: 15000 });
    expect(page.url()).toContain('/login');

    // Put the credential back so the account can be cleaned up.
    for (const credential of credentials) {
      await client.send(
        'WebAuthn.addCredential' as never,
        { authenticatorId, credential } as never
      );
    }
    await page.evaluate(() => localStorage.clear());
    await submitPassword(page);
    await page.locator('[data-testid="passkey-continue"]').click();
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    await removeAllPasskeys(page);
  });

  // The server-side proof the UI test above cannot give: talk to /graphql
  // directly, with no browser and no authenticator involved, and show that a
  // valid post-password ticket plus a bogus assertion is refused. If the server
  // ever stopped verifying, this fails while every UI test kept passing.
  test('the server refuses a bogus assertion', async ({ request }) => {
    const login = await request.post('/graphql', {
      data: {
        query:
          'mutation($e:String!,$p:String!){ login(email:$e,password:$p){ mfaToken enrolmentRequired } }',
        variables: { e: EMAIL, p: PASSWORD },
      },
    });
    const { data } = (await login.json()) as {
      data: { login: { mfaToken: string; enrolmentRequired: boolean } };
    };
    expect(typeof data.login.mfaToken).toBe('string');

    const forged = await request.post('/graphql', {
      data: {
        query:
          'mutation($t:String!,$r:JSON!){ verifyPasskey(mfaToken:$t,response:$r){ token user { id } } }',
        variables: {
          t: data.login.mfaToken,
          r: { id: 'bogus', rawId: 'bogus', type: 'public-key', response: {} },
        },
      },
    });
    const body = (await forged.json()) as {
      data?: { verifyPasskey: unknown };
      errors?: Array<{ extensions?: { code?: string } }>;
    };

    expect(body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    expect(body.data?.verifyPasskey ?? null).toBeNull();
  });
});
