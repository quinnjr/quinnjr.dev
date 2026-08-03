/**
 * Vitest configuration for server-side tests only
 * This configuration is completely separate from Angular/client-side tests
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Only run tests in the server directory
    include: [
      'tests/server/**/*.test.ts',
      'tests/server/**/*.spec.ts',
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
      // src/server/routes/** is deliberately NOT excluded: the HTTP surface
      // (/sitemap.xml, /robots.txt, /llms.txt, /api/github/repositories) has no
      // suite yet, and the coverage number should show that gap rather than
      // hide it behind an exclusion.
      exclude: [
        'src/server/**/*.d.ts',
        'src/server/**/*.interface.ts',
        'src/server/**/__tests__/**',
      ],
    },

    // Setup files
    setupFiles: ['./tests/server/__tests__/setup.ts'],

    // Test timeout
    testTimeout: 10000,

    // Globals for describe, it, expect, etc.
    globals: true,

    // TypeScript configuration
    typecheck: {
      tsconfig: './tsconfig.json',
    },

    // Force graphql (and everything that type-checks GraphQLSchema instances:
    // pothos, yoga, graphql-tools) to share one module instance in the vitest
    // worker so instanceof checks don't fail across realms.
    server: {
      deps: {
        inline: [
          'graphql',
          '@pothos/core',
          '@pothos/plugin-prisma',
          '@pothos/plugin-scope-auth',
          'graphql-yoga',
          /@graphql-tools\//,
        ],
      },
    },
  },
});

