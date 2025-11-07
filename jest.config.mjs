
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/server'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/server/**/*.ts',
    '!src/server/**/*.d.ts',
    '!src/server/**/*.interface.ts',
    '!src/server/routes/*.ts', // Integration tests handled separately
  ],
  coverageDirectory: 'coverage/server',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      }
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/src/server/__tests__/setup.ts'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

export default config;
