import 'reflect-metadata';

// Mock environment variables
process.env['NODE_ENV'] = 'test';
process.env['DATABASE_URL'] = 'file:./test.db';

// Global test timeout
jest.setTimeout(10000);

