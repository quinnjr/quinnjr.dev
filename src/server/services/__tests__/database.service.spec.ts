import { DatabaseService } from '../database.service';

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockPrismaClient: {
    $connect: jest.Mock;
    $disconnect: jest.Mock;
    $queryRaw: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DatabaseService();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockPrismaClient = (service as any).client;
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
      mockPrismaClient.$queryRaw = jest.fn().mockRejectedValue(new Error('Connection failed'));

      const result = await service.healthCheck();
      expect(result).toBe(false);
    });
  });
});

