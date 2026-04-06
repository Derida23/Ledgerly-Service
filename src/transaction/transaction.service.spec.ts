import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService, getMockDb } from '../test/prisma-mock';

describe('TransactionService', () => {
  let service: TransactionService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionService, createMockPrismaService()],
    }).compile();

    service = module.get(TransactionService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  const userId = 'user-1';
  const mockDb = () => getMockDb(prisma);

  describe('create', () => {
    it('should throw BadRequestException when EXPENSE has no method', async () => {
      await expect(
        service.create(userId, {
          amount: 50000,
          type: 'EXPENSE',
          walletId: 'w1',
          categoryId: 'c1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create an expense transaction', async () => {
      const dto = {
        amount: 50000,
        type: 'EXPENSE' as const,
        walletId: 'w1',
        categoryId: 'c1',
        method: 'QRIS' as const,
      };
      const expected = {
        id: 't1',
        ...dto,
        date: new Date(),
        note: null,
        transferPairId: null,
        wallet: { id: 'w1', name: 'BCA' },
        category: { id: 'c1', name: 'Food', icon: '🍔' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb().transaction.create.mockResolvedValue(expected);

      const result = await service.create(userId, dto);

      expect(result).toEqual(expected);
    });

    it('should create an income transaction without method', async () => {
      const dto = {
        amount: 8500000,
        type: 'INCOME' as const,
        walletId: 'w1',
        categoryId: 'c1',
      };
      mockDb().transaction.create.mockResolvedValue({ id: 't1', ...dto });

      const result = await service.create(userId, dto);

      expect(result.id).toBe('t1');
    });
  });

  describe('createTransfer', () => {
    it('should throw when source and target wallet are same', async () => {
      await expect(
        service.createTransfer(userId, {
          amount: 1000000,
          sourceWalletId: 'w1',
          targetWalletId: 'w1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when not found', async () => {
      mockDb().transaction.findUnique.mockResolvedValue(null);

      await expect(service.findOne('not-exist', userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for other user', async () => {
      mockDb().transaction.findUnique.mockResolvedValue({
        id: 't1',
        userId: 'other-user',
      });

      await expect(service.findOne('t1', userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      mockDb().$transaction.mockResolvedValue([[{ id: 't1' }], 1]);

      const result = await service.findAll(userId, { page: '1', limit: '20' });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });
  });
});
