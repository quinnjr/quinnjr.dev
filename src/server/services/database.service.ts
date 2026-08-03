import { singleton } from 'tsyringe';

import { PrismaClient } from '../../generated/prisma/client';

/**
 * Database service that provides a singleton Prisma client instance
 */
@singleton()
export class DatabaseService {
  private client: PrismaClient;
  private shuttingDown = false;

  constructor() {
    this.client = new PrismaClient({
      log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    this.registerShutdownHooks();
  }

  /**
   * Close the pool on the signals a container actually receives.
   *
   * `beforeExit` was the wrong hook twice over: it never fires for SIGTERM (how
   * an orchestrator stops us), and its listener ran synchronously so the process
   * could exit before `$disconnect()` settled.
   */
  private registerShutdownHooks(): void {
    for (const signal of ['SIGTERM', 'SIGINT'] as const) {
      process.once(signal, () => {
        this.shutdown(signal).catch((error: unknown) => {
          console.error(`Error during ${signal} shutdown:`, error);
        });
      });
    }
  }

  private async shutdown(signal: string): Promise<void> {
    if (this.shuttingDown) {
      return;
    }
    this.shuttingDown = true;
    try {
      await this.disconnect();
    } catch (error) {
      console.error(`Failed to disconnect from the database on ${signal}:`, error);
    }
    process.exit(0);
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
