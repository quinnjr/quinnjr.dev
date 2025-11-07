import { singleton } from 'tsyringe';
import { PrismaClient } from '../../generated/prisma/client';

/**
 * Database service that provides a singleton Prisma client instance
 */
@singleton()
export class DatabaseService {
  private client: PrismaClient;

  constructor() {
    this.client = new PrismaClient({
      log: process.env['NODE_ENV'] === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    });

    // Graceful shutdown
    process.on('beforeExit', async () => {
      await this.disconnect();
    });
  }

  /**
   * Get the Prisma client instance
   */
  public getClient(): PrismaClient {
    return this.client;
  }

  /**
   * Connect to the database
   */
  public async connect(): Promise<void> {
    await this.client.$connect();
  }

  /**
   * Disconnect from the database
   */
  public async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }

  /**
   * Check database connection health
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

