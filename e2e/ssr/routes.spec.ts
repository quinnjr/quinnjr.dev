import { test, expect } from '@playwright/test';

/**
 * Express/SSR route coverage.
 *
 * These routes are served by src/server.ts, not by Angular. The default e2e
 * webServer is `ng serve` with `"ssr": false`, so they do not exist there and
 * this file is a no-op under `pnpm test:e2e`. Point PLAYWRIGHT_SSR_BASE_URL at
 * a running SSR server to actually exercise them:
 *
 *   pnpm build
 *   DATABASE_URL=postgresql://user:pass@host:5432/db pnpm serve:ssr:quinnjr.dev &
 *   PLAYWRIGHT_SSR_BASE_URL=http://localhost:4000 \
 *     pnpm exec playwright test --project=ssr-routes
 *
 * /sitemap.xml and /llms.txt read the database; /robots.txt and /healthz do not.
 */
const SSR_BASE_URL = process.env['PLAYWRIGHT_SSR_BASE_URL'];

test.describe('SSR routes', () => {
  test.skip(
    !SSR_BASE_URL,
    'Set PLAYWRIGHT_SSR_BASE_URL to a running SSR server to run the SSR route suite.'
  );

  test('/healthz answers the liveness probe', async ({ request }) => {
    const response = await request.get('/healthz');
    expect(response.status()).toBe(200);
    expect((await response.text()).trim()).toBe('ok');
  });

  test('/robots.txt is plain text and points at the canonical sitemap', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/plain');

    const body = await response.text();
    expect(body).toContain('User-agent:');
    expect(body).toMatch(/Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/);
  });

  test('/sitemap.xml is a well-formed urlset', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('xml');

    const body = await response.text();
    expect(body).toContain('<urlset');
    expect(body).toContain('</urlset>');
    expect(body).toMatch(/<loc>https?:\/\/\S+<\/loc>/);
  });

  test('/llms.txt is a plain-text site summary', async ({ request }) => {
    const response = await request.get('/llms.txt');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/plain');
    expect((await response.text()).length).toBeGreaterThan(0);
  });

  test('/api/github/repositories answers with the success envelope', async ({ request }) => {
    const response = await request.get('/api/github/repositories');
    // Unauthenticated GitHub API calls are rate-limited, so a 500 from the
    // upstream is acceptable — the envelope shape is what is under test.
    expect([200, 500]).toContain(response.status());
    const body = (await response.json()) as { success: boolean };
    expect(body).toHaveProperty('success');
    expect(body.success).toBe(response.status() === 200);
  });
});
