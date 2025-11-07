// Manual mock for Prisma Client
export class PrismaClient {
  $connect = jest.fn().mockResolvedValue(undefined);
  $disconnect = jest.fn().mockResolvedValue(undefined);
  $queryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
  
  blogPost = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  
  blogPostTag = {
    deleteMany: jest.fn(),
  };
  
  category = {
    findMany: jest.fn(),
  };
  
  tag = {
    findMany: jest.fn(),
  };
  
  sitemapConfig = {
    findMany: jest.fn(),
  };
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  SCHEDULED = 'SCHEDULED',
  ARCHIVED = 'ARCHIVED',
}

