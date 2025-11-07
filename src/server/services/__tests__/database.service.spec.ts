import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '../../../generated/prisma/client';
import { DatabaseService } from '../database.service';

// Mock PrismaClient before importing DatabaseService
jest.mock('../../../generated/prisma/client', () => ({
  PrismaClient: jest.fn(),
}));

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockPrismaClient: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = mockDeep<PrismaClient>();
    mockPrismaClient.$connect.mockResolvedValue(undefined);
    mockPrismaClient.$disconnect.mockResolvedValue(undefined);
    mockPrismaClient.$queryRaw.mockResolvedValue([{ '?column?': 1 }] as never);

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
      mockPrismaClient.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      const result = await service.healthCheck();
      expect(result).toBe(false);
    });
  });
});

