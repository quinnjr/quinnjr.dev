import { vi, type MockedFunction } from 'vitest';

/**
 * Creates a mock PrismaClient with commonly used methods
 */
export function createMockPrismaClient() {
  return {
    blogPost: {
      findMany: vi.fn() as MockedFunction<() => Promise<unknown[]>>,
      findUnique: vi.fn() as MockedFunction<() => Promise<unknown | null>>,
      findFirst: vi.fn() as MockedFunction<() => Promise<unknown | null>>,
      create: vi.fn() as MockedFunction<() => Promise<unknown>>,
      update: vi.fn() as MockedFunction<() => Promise<unknown>>,
      delete: vi.fn() as MockedFunction<() => Promise<unknown>>,
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
  };
}

