import { vi, type MockedFunction } from 'vitest';

import { PrismaClient } from '../../../../src/generated/prisma/client';
import { DatabaseService } from '../../../../src/server/services/database.service';

// Mock PrismaClient before importing DatabaseService
vi.mock('../../../../src/generated/prisma/client', () => ({
  PrismaClient: vi.fn(),
}));

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockPrismaClient: {
    $connect: MockedFunction<() => Promise<void>>;
    $disconnect: MockedFunction<() => Promise<void>>;
    $queryRaw: MockedFunction<() => Promise<unknown[]>>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrismaClient = {
      $connect: vi.fn().mockResolvedValue(undefined),
      $disconnect: vi.fn().mockResolvedValue(undefined),
      $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    // Replace the client in the service with our mock
    service = new DatabaseService();

    (service as any).client = mockPrismaClient;
  });

  afterEach(async () => {
    await service.disconnect();
  });

  describe('getClient', () => {
    // Asserting `getClient() === mockPrismaClient` only re-verified the
    // assignment beforeEach itself performed. The contract worth pinning is
    // that the service constructs exactly one PrismaClient and hands the same
    // instance back on every call — so build an untouched service here.
    it('constructs exactly one PrismaClient per service instance', () => {
      const PrismaClientMock = vi.mocked(PrismaClient);
      PrismaClientMock.mockClear();

      const fresh = new DatabaseService();

      expect(PrismaClientMock).toHaveBeenCalledTimes(1);
      fresh.getClient();
      fresh.getClient();
      expect(PrismaClientMock).toHaveBeenCalledTimes(1);
    });

    it('returns the same client instance on every call', () => {
      const fresh = new DatabaseService();

      const first = fresh.getClient();
      const second = fresh.getClient();

      expect(first).toBeDefined();
      expect(second).toBe(first);
    });
  });

  describe('connect', () => {
    it('should connect to the database', async () => {
      await service.connect();
      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('disconnect', () => {
    it('should disconnect from the database', async () => {
      await service.disconnect();
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('healthCheck', () => {
    it('should return true when database is healthy', async () => {
      const result = await service.healthCheck();
      expect(result).toBe(true);
      expect(mockPrismaClient.$queryRaw).toHaveBeenCalled();
    });

    it('should return false when database connection fails', async () => {
      // Suppress console.error for this test since we're testing the error case
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Suppress error output in tests
      });

      mockPrismaClient.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      const result = await service.healthCheck();
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Database health check failed:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
