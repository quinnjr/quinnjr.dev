import { vi, type MockedFunction } from 'vitest';

/**
 * Creates a mock PrismaClient with commonly used methods
 */
export function createMockPrismaClient() {
  const client = {
    blogPost: {
      findMany: vi.fn() as MockedFunction<() => Promise<unknown[]>>,
      findUnique: vi.fn() as MockedFunction<() => Promise<unknown>>,
      findFirst: vi.fn() as MockedFunction<() => Promise<unknown>>,
      create: vi.fn() as MockedFunction<() => Promise<unknown>>,
      update: vi.fn() as MockedFunction<() => Promise<unknown>>,
      delete: vi.fn() as MockedFunction<() => Promise<unknown>>,
    },
    // Tag replacement on update touches the join table, and may be wrapped in a
    // transaction, so both are stubbed here.
    blogPostTag: {
      deleteMany: vi.fn() as MockedFunction<() => Promise<unknown>>,
      createMany: vi.fn() as MockedFunction<() => Promise<unknown>>,
    },
    category: {
      findMany: vi.fn() as MockedFunction<() => Promise<unknown[]>>,
    },
    tag: {
      findMany: vi.fn() as MockedFunction<() => Promise<unknown[]>>,
    },
    sitemapConfig: {
      findMany: vi.fn() as MockedFunction<() => Promise<unknown[]>>,
    },
    // Interactive form receives the client itself as the transaction handle;
    // array form just awaits the batch.
    $transaction: vi.fn(),
  };

  client.$transaction.mockImplementation(async (arg: unknown) => {
    if (typeof arg === 'function') {
      return (arg as (tx: typeof client) => Promise<unknown>)(client);
    }
    return Promise.all(arg as Array<Promise<unknown>>);
  });

  return client;
}
