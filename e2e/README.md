# End-to-End Testing with Playwright

This directory contains end-to-end (E2E) tests for the quinnjr.dev application using Playwright.

## Running Tests

### Run all E2E tests
```bash
pnpm test:e2e
```

### Run tests in UI mode (interactive)
```bash
pnpm test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
pnpm test:e2e:headed
```

### Debug tests
```bash
pnpm test:e2e:debug
```

### View test report
```bash
pnpm test:e2e:report
```

## Test Structure

- `home.spec.ts` - Tests for the home page
- `navigation.spec.ts` - Tests for navigation functionality
- `pages.spec.ts` - Tests for all page routes
- `auth.spec.ts` - Tests for authentication flows
- `accessibility.spec.ts` - Accessibility and a11y tests

## Configuration

Tests are configured in `playwright.config.mjs`. The configuration includes:

- **Base URL**: `http://localhost:4200` (configurable via `PLAYWRIGHT_BASE_URL` env var)
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Mobile Chrome and Safari viewports
- **Auto-start server**: Automatically starts the Angular dev server before tests
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: Captured on failure
- **Traces**: Collected on first retry

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test('should do something', async ({ page }) => {
  await page.goto('/home');
  await expect(page).toHaveURL(/.*home/);
});
```

### Best Practices

1. Use descriptive test names
2. Use `test.describe` blocks to group related tests
3. Use `test.beforeEach` for common setup
4. Use page object pattern for complex pages
5. Wait for elements to be visible before interacting
6. Use accessibility-friendly selectors (roles, labels)
7. Clean up after tests if needed

### Example: Testing User Interactions

```typescript
test('should navigate to articles page', async ({ page }) => {
  await page.goto('/home');
  const articlesLink = page.getByRole('link', { name: /articles/i });
  await articlesLink.click();
  await expect(page).toHaveURL(/.*articles/);
});
```

## CI/CD Integration

E2E tests run automatically in CI/CD pipelines. The tests:
- Start the application server automatically
- Run in headless mode
- Generate HTML reports on failure
- Retry failed tests twice

## Environment Variables

- `PLAYWRIGHT_BASE_URL` - Override the base URL for tests
- `CI` - Automatically set in CI environments

## Debugging

1. Use `pnpm test:e2e:debug` to run tests in debug mode
2. Use `pnpm test:e2e:ui` for interactive test running
3. Check `test-results/` directory for screenshots and traces
4. Use `await page.pause()` in tests to pause execution

