import { vi, type MockedFunction } from 'vitest';
import { PrismaClient } from '../../../generated/prisma/client';
import { DatabaseService } from '../database.service';

// Mock PrismaClient before importing DatabaseService
vi.mock('../../../generated/prisma/client', () => ({
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).client = mockPrismaClient;
  });

  afterEach(async () => {
    await service.disconnect();
  });

  describe('getClient', () => {
    it('should return the Prisma client instance', () => {
      const client = service.getClient();
      expect(client).toBeDefined();
      expect(client).toBe(mockPrismaClient);
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
