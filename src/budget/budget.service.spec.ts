import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BudgetService } from './budget.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService, getMockDb } from '../test/prisma-mock';

describe('BudgetService', () => {
  let service: BudgetService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BudgetService, createMockPrismaService()],
    }).compile();

    service = module.get(BudgetService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  const userId = 'user-1';
  const mockDb = () => getMockDb(prisma);

  describe('findOne', () => {
    it('should throw NotFoundException when budget not found', async () => {
      mockDb().budget.findUnique.mockResolvedValue(null);

      await expect(service.findOne('not-exist', userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return budget with spending calculation', async () => {
      mockDb().budget.findUnique.mockResolvedValue({
        id: 'b1',
        name: 'Monthly',
        limit: new Prisma.Decimal(1000000),
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        categories: [
          { category: { id: 'c1', name: 'Food', icon: '🍔' } },
          { category: { id: 'c2', name: 'Transport', icon: '🚗' } },
        ],
      });

      mockDb().transaction.aggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(750000) },
      });

      const result = await service.findOne('b1', userId);

      expect(result.spent).toBe(750000);
      expect(result.remaining).toBe(250000);
      expect(result.percentage).toBe(75);
      expect(result.status).toBe('NORMAL');
    });

    it('should return WARNING status at 80%', async () => {
      mockDb().budget.findUnique.mockResolvedValue({
        id: 'b1',
        name: 'Monthly',
        limit: new Prisma.Decimal(1000000),
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        categories: [{ category: { id: 'c1', name: 'Food', icon: '🍔' } }],
      });

      mockDb().transaction.aggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(850000) },
      });

      const result = await service.findOne('b1', userId);

      expect(result.percentage).toBe(85);
      expect(result.status).toBe('WARNING');
    });

    it('should return OVER_BUDGET status above 100%', async () => {
      mockDb().budget.findUnique.mockResolvedValue({
        id: 'b1',
        name: 'Monthly',
        limit: new Prisma.Decimal(1000000),
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        categories: [{ category: { id: 'c1', name: 'Food', icon: '🍔' } }],
      });

      mockDb().transaction.aggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(1200000) },
      });

      const result = await service.findOne('b1', userId);

      expect(result.percentage).toBe(120);
      expect(result.status).toBe('OVER_BUDGET');
    });
  });

  describe('create', () => {
    it('should throw ConflictException on duplicate name', async () => {
      mockDb().budget.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('', {
          code: 'P2002',
          meta: { target: ['userId', 'name'] },
          clientVersion: '5.0.0',
        }),
      );

      await expect(
        service.create(userId, {
          name: 'Monthly',
          limit: 1000000,
          categoryIds: ['c1'],
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
