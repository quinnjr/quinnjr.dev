/** @type {import('jest').Config} */
export default {
  // Override default testMatch to only include client-side tests
  testMatch: ['<rootDir>/src/app/**/*.spec.ts'],
  // Explicitly ignore server tests and e2e tests using regex patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '.*/src/server/.*',
    '.*/e2e/.*',
  ],
  collectCoverageFrom: ['src/app/**/*.ts', '!src/app/**/*.spec.ts', '!src/app/**/*.d.ts'],
};

