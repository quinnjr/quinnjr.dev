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

// The header explains that these cases sign in more often than the shipped
// per-email limit allows, and that without the override the run dies looking
// like a credentials failure. Documenting that and then not checking it left
// the misleading failure in place, so this asserts the prerequisite up front.
// It is checked on the RUNNER, which is a proxy for the server's own setting —
// so it catches the common mistake (forgot it entirely) rather than every one.
test.skip(
  !!process.env['PLAYWRIGHT_SSR_BASE_URL'] && !process.env['AUTH_RATE_LIMIT_OVERRIDES'],
  'Set AUTH_RATE_LIMIT_OVERRIDES on BOTH the SSR server and this runner — see the header. ' +
    'Without it the shipped 5-logins-per-email limit trips mid-run and reports as "Invalid email or password".'
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

// Every case drives the SAME seeded admin account through enrolment and back,
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

/**
 * Removes EVERY credential, restoring the no-passkey state the next test
 * expects. The last one needs the explicit confirmation.
 *
 * The loop is the point: an earlier version clicked `.first()` exactly once and
 * then waited for the empty state, so an account left holding two credentials
 * by a failed run timed out here with one still enrolled — which poisoned the
 * next run too. The account is shared and long-lived, so this has to converge
 * from any starting count, not just from one.
 */
async function removeAllPasskeys(page: Page): Promise<void> {
  await page.goto('/admin/security');
  await page.waitForSelector('[data-testid="passkey-add"]');

  const confirm = page.locator('[data-testid="passkey-remove-confirm-yes"]');
  const empty = page.locator('[data-testid="passkey-empty"]');
  const removeButtons = page.getByRole('button', { name: /^remove$/i });

  // Bounded so a UI that stops removing cannot spin forever; the account never
  // legitimately holds anywhere near this many.
  for (let guard = 0; guard < 10; guard++) {
    if ((await removeButtons.count()) === 0) {
      break;
    }
    await removeButtons.first().click();
    // Only the last key raises the confirmation, so wait for whichever of the
    // two outcomes the click produces before deciding. `isVisible()` on its own
    // does not retry, and change detection is scheduled rather than
    // synchronous, so asking straight after the click reliably caught the DOM
    // one frame early — reporting "no dialog", skipping the confirm, and then
    // timing out against an empty state the un-confirmed removal was never
    // going to reach.
    await expect(confirm.or(empty).first()).toBeVisible({ timeout: 15000 });
    if (await confirm.isVisible()) {
      await confirm.click();
    }
    await expect(confirm).toBeHidden({ timeout: 15000 });
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
    const { credentials } = await client.send('WebAuthn.getCredentials', { authenticatorId });
    expect(credentials.length).toBeGreaterThan(0);

    await page.evaluate(() => localStorage.clear());

    // `finally` is load-bearing, not tidiness. Between the clear and the
    // restore the account holds a passkey row whose private key exists nowhere,
    // and removing a passkey needs a session, which needs asserting that very
    // passkey — so there is no route back. Any failure in between (a locator
    // timing out, the server 500-ing, the worker being killed) would otherwise
    // leave the shared account permanently unusable and every later run failing
    // at test 1's enrol stage: exactly the defect this restore was added to fix.
    try {
      await client.send('WebAuthn.clearCredentials', { authenticatorId });

      await submitPassword(page);
      await expect(page.locator('[data-testid="passkey-stage"]')).toBeVisible({ timeout: 15000 });
      await page.locator('[data-testid="passkey-continue"]').click();

      await expect(page.locator('.login-error')).toBeVisible({ timeout: 15000 });
      expect(page.url()).toContain('/login');
    } finally {
      for (const credential of credentials) {
        await client.send('WebAuthn.addCredential', { authenticatorId, credential });
      }
    }

    await page.evaluate(() => localStorage.clear());
    await submitPassword(page);
    await page.locator('[data-testid="passkey-continue"]').click();
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    await removeAllPasskeys(page);
  });

  /**
   * The server-side proof the UI test above cannot give: talk to /graphql
   * directly and show that a ticket which HAS reached the assertion stage,
   * plus a bogus assertion, is refused by `finishAuthentication`.
   *
   * The enrolment is not incidental. An earlier version ran with the account in
   * its cleaned-up, credential-less state, so `login` minted an `enrol`-scoped
   * ticket and `verifyPasskey` rejected it at the scope check — before any
   * assertion verification. It asserted UNAUTHENTICATED and passed, and would
   * have passed with WebAuthn verification deleted outright, which is the exact
   * opposite of what its comment claimed. `enrolmentRequired === false` is
   * asserted below precisely so that regression cannot recur silently: it is
   * the observable that distinguishes the two ticket scopes.
   */
  test('the server refuses a bogus assertion', async ({ page, request }) => {
    await attachAuthenticator(page);
    await enrolFromLogin(page, 'Assert key');
    await page.evaluate(() => localStorage.clear());

    const login = await request.post('/graphql', {
      data: {
        query:
          'mutation($e:String!,$p:String!){ login(email:$e,password:$p){ mfaToken mfaRequired enrolmentRequired } }',
        variables: { e: EMAIL, p: PASSWORD },
      },
    });
    // Surface a throttled or errored login as itself rather than as a
    // TypeError on `data.login`.
    expect(login.ok(), await login.text()).toBeTruthy();
    const { data, errors } = (await login.json()) as {
      data?: { login: { mfaToken: string; mfaRequired: boolean; enrolmentRequired: boolean } };
      errors?: Array<{ message?: string; extensions?: { code?: string } }>;
    };
    expect(errors, JSON.stringify(errors)).toBeUndefined();
    expect(typeof data?.login.mfaToken).toBe('string');
    // The whole point: this must be an `assert` ticket, or the test below
    // proves nothing about assertion verification.
    expect(data?.login.enrolmentRequired).toBe(false);
    expect(data?.login.mfaRequired).toBe(true);

    const forged = await request.post('/graphql', {
      data: {
        query:
          'mutation($t:String!,$r:JSON!){ verifyPasskey(mfaToken:$t,response:$r){ token user { id } } }',
        variables: {
          t: data!.login.mfaToken,
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

    // Sign in properly and clean up, so the suite stays re-runnable.
    await submitPassword(page);
    await page.locator('[data-testid="passkey-continue"]').click();
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    await removeAllPasskeys(page);
  });
});
