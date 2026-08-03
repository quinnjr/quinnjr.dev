import 'reflect-metadata';

// Mock environment variables
process.env['NODE_ENV'] = 'test';
// Must be Postgres-shaped: prisma/schema.prisma declares `provider =
// "postgresql"`, and a `file:` URL fails validation (P1012) the moment a test
// touches a real client instead of a mock.
process.env['DATABASE_URL'] =
  'postgresql://quinnjr:quinnjr@localhost:5432/quinnjr_test?schema=public';
process.env['JWT_SECRET'] = 'test-secret';
