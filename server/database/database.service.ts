import {
  INestApplication,
  Injectable,
  OnModuleInit,
  OnModuleDestroy
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleDestroy, OnModuleInit
{
  public async onModuleInit() {
    // await this.$connect();
  }

  public async onModuleDestroy() {
    await this.$disconnect();
  }
}
