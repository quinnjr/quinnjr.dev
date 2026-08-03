import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// dotenv.config({ path: '.env' });

/**
 * Dev-server origin for the SPA suite.
 *
 * Both the baseURL and the managed webServer derive from this one value. When
 * they were allowed to disagree — baseURL configurable, webServer pinned to
 * 4200 — a dev server for an unrelated project already listening on 4200 was
 * silently adopted by `reuseExistingServer`, and the whole suite ran green-ish
 * against the wrong application. Override PLAYWRIGHT_BASE_URL to move both.
 */
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4200';
const BASE_PORT = new URL(BASE_URL).port || '4200';

/**
 * Which projects this invocation selected, from `--project=x` / `--project x`.
 *
 * `webServer` is global in Playwright — it cannot be attached to one project —
 * so without this an `--project=ssr-routes` run boots an `ng serve` that no
 * test in that project ever talks to (they target PLAYWRIGHT_SSR_BASE_URL) and
 * waits up to two minutes for it. An empty list means "all projects", which
 * includes chromium, so the dev server is still started for a bare run.
 */
const selectedProjects = process.argv.flatMap((arg, index) => {
  if (arg === '--project') return process.argv[index + 1] ? [process.argv[index + 1]] : [];
  if (arg.startsWith('--project=')) return [arg.slice('--project='.length)];
  return [];
});
const needsDevServer = selectedProjects.length === 0 || selectedProjects.includes('chromium');

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? 'html' : 'list',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: BASE_URL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    /* Increase timeout for actions */
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  /* Global test timeout */
  timeout: 60000,
  expect: {
    /* Increase timeout for assertions */
    timeout: 10000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      // The SSR-only suite lives under e2e/ssr and is driven by its own project
      // (below) against a built SSR server, not the `ng serve` dev server.
      testIgnore: '**/ssr/**',
      use: { ...devices['Desktop Chrome'] },
    },

    /**
     * Express/SSR surface: /robots.txt, /sitemap.xml, /llms.txt, /healthz.
     *
     * The default `webServer` is `ng serve`, whose development configuration
     * sets `"ssr": false`, so none of those routes exist there. These specs
     * therefore SKIP unless PLAYWRIGHT_SSR_BASE_URL points at a running SSR
     * server, which keeps `pnpm test:e2e` green and fast.
     *
     * To run them:
     *   pnpm build
     *   DATABASE_URL=postgresql://... pnpm serve:ssr:quinnjr.dev &
     *   PLAYWRIGHT_SSR_BASE_URL=http://localhost:4000 pnpm exec playwright test --project=ssr-routes
     */
    {
      name: 'ssr-routes',
      testDir: './e2e/ssr',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PLAYWRIGHT_SSR_BASE_URL || 'http://localhost:4000',
      },
    },

    // Additional browsers disabled for CI to reduce test time and complexity
    // To enable locally, uncomment the sections below
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    //
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    //
    // /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: `pnpm start --port ${BASE_PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});

