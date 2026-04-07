import { PrismaService } from '../prisma/prisma.service';

interface MockModel {
  create: jest.Mock;
  createMany: jest.Mock;
  findMany: jest.Mock;
  findUnique: jest.Mock;
  findFirst: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  deleteMany: jest.Mock;
  count: jest.Mock;
  aggregate: jest.Mock;
  groupBy: jest.Mock;
}

type PartialMockModel = Partial<MockModel> & Record<string, jest.Mock>;

interface MockDb {
  wallet: PartialMockModel;
  category: PartialMockModel;
  transaction: PartialMockModel;
  recurring: PartialMockModel;
  budget: PartialMockModel;
  budgetCategory: PartialMockModel;
  $transaction: jest.Mock;
}

export function createMockPrismaService() {
  const mockDb: MockDb = {
    wallet: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    recurring: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    budget: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    budgetCategory: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(mockDb)),
  };

  return {
    provide: PrismaService,
    useValue: { db: mockDb },
  };
}

export function getMockDb(prismaService: PrismaService): MockDb {
  return prismaService.db as unknown as MockDb;
}
