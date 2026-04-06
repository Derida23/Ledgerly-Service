import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Missing required environment variable: DATABASE_URL');
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: [
      { level: 'query', emit: 'event' },
      { level: 'warn', emit: 'event' },
      { level: 'error', emit: 'event' },
    ],
  });
}

type PrismaClientInstance = ReturnType<typeof createPrismaClient>;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly client: PrismaClientInstance;

  constructor() {
    this.client = createPrismaClient();
  }

  get db(): PrismaClientInstance {
    return this.client;
  }

  async onModuleInit() {
    await this.client.$connect();
    this.logger.log('Database connected');

    this.client.$on('query', (e: Prisma.QueryEvent) => {
      if (e.duration > 200) {
        this.logger.warn(
          `Slow query (${e.duration}ms): ${e.query.substring(0, 200)}`,
        );
      }
    });

    this.client.$on('error', (e: Prisma.LogEvent) => {
      this.logger.error(e.message);
    });
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
    this.logger.log('Database disconnected');
  }
}
