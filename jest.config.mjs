/**
 * Jest configuration for server-side tests only
 * This configuration is separate from Angular/client-side tests
 */

const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Only run tests in the server directory
  roots: ['<rootDir>/src/server'],
  
  // Match server test files only
  testMatch: [
    '<rootDir>/src/server/**/__tests__/**/*.test.ts',
    '<rootDir>/src/server/**/__tests__/**/*.spec.ts',
    '<rootDir>/src/server/**/*.spec.ts',
  ],
  
  // Explicitly exclude client-side and e2e tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/app/',
    '<rootDir>/e2e/',
  ],
  
  // Coverage collection for server code only
  collectCoverageFrom: [
    'src/server/**/*.ts',
    '!src/server/**/*.d.ts',
    '!src/server/**/*.interface.ts',
    '!src/server/routes/*.ts', // Integration tests handled separately
    '!src/server/**/__tests__/**',
  ],
  
  coverageDirectory: 'coverage/server',
  coverageReporters: ['text', 'lcov', 'html'],
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
        },
      },
    ],
  },
  
  transformIgnorePatterns: ['node_modules/(?!(@prisma|.*\\.mjs$))'],
  
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  setupFilesAfterEnv: ['<rootDir>/src/server/__tests__/setup.ts'],
  
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

export default config;

