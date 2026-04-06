import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService, getMockDb } from '../test/prisma-mock';

describe('WalletService', () => {
  let service: WalletService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WalletService, createMockPrismaService()],
    }).compile();

    service = module.get(WalletService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  const userId = 'user-1';
  const mockDb = () => getMockDb(prisma);

  describe('create', () => {
    it('should create a wallet', async () => {
      const dto = { name: 'Bank BCA', initialBalance: 5000000 };
      const expected = { id: 'w1', ...dto, createdAt: new Date(), updatedAt: new Date() };
      mockDb().wallet.create.mockResolvedValue(expected);

      const result = await service.create(userId, dto);

      expect(result).toEqual(expected);
      expect(mockDb().wallet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: 'Bank BCA', userId }),
        }),
      );
    });

    it('should throw ConflictException on duplicate name', async () => {
      mockDb().wallet.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('', {
          code: 'P2002',
          meta: { target: ['userId', 'name'] },
          clientVersion: '5.0.0',
        }),
      );

      await expect(service.create(userId, { name: 'BCA' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return wallets with calculated balance', async () => {
      mockDb().wallet.findMany.mockResolvedValue([
        {
          id: 'w1',
          name: 'BCA',
          initialBalance: new Prisma.Decimal(5000000),
          createdAt: new Date(),
          updatedAt: new Date(),
          transactions: [
            { amount: new Prisma.Decimal(1000000), type: 'INCOME' },
            { amount: new Prisma.Decimal(500000), type: 'EXPENSE' },
          ],
        },
      ]);

      const result = await service.findAll(userId);

      expect(result).toHaveLength(1);
      expect(result[0]!.balance).toBe(5500000); // 5M + 1M - 500K
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when wallet not found', async () => {
      mockDb().wallet.findUnique.mockResolvedValue(null);

      await expect(service.findOne('not-exist', userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when wallet belongs to other user', async () => {
      mockDb().wallet.findUnique.mockResolvedValue({
        id: 'w1',
        userId: 'other-user',
        transactions: [],
      });

      await expect(service.findOne('w1', userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('seedDefaults', () => {
    it('should seed 7 wallets when none exist', async () => {
      mockDb().wallet.count.mockResolvedValue(0);
      mockDb().wallet.createMany.mockResolvedValue({ count: 7 });

      await service.seedDefaults(userId);

      expect(mockDb().wallet.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ name: 'Bank Mandiri' }),
            expect.objectContaining({ name: 'Bibit' }),
          ]),
        }),
      );
    });

    it('should skip seed when wallets already exist', async () => {
      mockDb().wallet.count.mockResolvedValue(5);

      await service.seedDefaults(userId);

      expect(mockDb().wallet.createMany).not.toHaveBeenCalled();
    });
  });
});
