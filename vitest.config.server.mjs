/**
 * Vitest configuration for server-side tests only
 * This configuration is completely separate from Angular/client-side tests
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only run tests in the server directory
    include: [
      'src/server/**/__tests__/**/*.test.ts',
      'src/server/**/__tests__/**/*.spec.ts',
      'src/server/**/*.spec.ts',
    ],
    exclude: [
      'node_modules/**',
      'src/app/**',
      'e2e/**',
      'dist/**',
      'coverage/**',
    ],

    // Test environment
    environment: 'node',

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage/server',
      include: ['src/server/**/*.ts'],
      exclude: [
        'src/server/**/*.d.ts',
        'src/server/**/*.interface.ts',
        'src/server/routes/*.ts', // Integration tests handled separately
        'src/server/**/__tests__/**',
      ],
    },

    // Setup files
    setupFiles: ['./src/server/__tests__/setup.ts'],

    // Test timeout
    testTimeout: 10000,

    // Globals for describe, it, expect, etc.
    globals: true,

    // TypeScript configuration
    typecheck: {
      tsconfig: './tsconfig.json',
    },
  },
});

