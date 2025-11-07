/**
 * Jest configuration for Angular/client-side tests only
 * This configuration excludes all server-side tests
 */

const config = {
  // Only run tests in the app directory (client-side)
  roots: ['<rootDir>/src/app'],
  
  // Match client-side test files only
  testMatch: ['<rootDir>/src/app/**/*.spec.ts'],
  
  // Explicitly exclude server-side tests and e2e tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/server/',
    '<rootDir>/e2e/',
  ],
  
  // Coverage collection for client code only
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/app/**/*.spec.ts',
    '!src/app/**/*.d.ts',
  ],
  
  coverageDirectory: 'coverage/client',
  coverageReporters: ['text', 'lcov', 'html'],
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  
  transformIgnorePatterns: ['/node_modules/'],
  
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

export default config;

