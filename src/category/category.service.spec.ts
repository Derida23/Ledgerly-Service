import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CategoryService } from './category.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService, getMockDb } from '../test/prisma-mock';

describe('CategoryService', () => {
  let service: CategoryService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoryService, createMockPrismaService()],
    }).compile();

    service = module.get(CategoryService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  const userId = 'user-1';
  const mockDb = () => getMockDb(prisma);

  describe('seedDefaults', () => {
    it('should seed 14 default categories when none exist', async () => {
      mockDb().category.count.mockResolvedValue(0);
      mockDb().category.createMany.mockResolvedValue({ count: 14 });

      await service.seedDefaults(userId);

      expect(mockDb().category.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              name: 'Makanan & Minuman',
              type: 'EXPENSE',
            }),
            expect.objectContaining({ name: 'Gaji', type: 'INCOME' }),
          ]),
        }),
      );
    });

    it('should skip when categories already exist', async () => {
      mockDb().category.count.mockResolvedValue(14);

      await service.seedDefaults(userId);

      expect(mockDb().category.createMany).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a category', async () => {
      const dto = { name: 'Custom', icon: '⭐', type: 'EXPENSE' as const };
      const expected = {
        id: 'c1',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb().category.create.mockResolvedValue(expected);

      const result = await service.create(userId, dto);

      expect(result).toEqual(expected);
    });

    it('should throw ConflictException on duplicate', async () => {
      mockDb().category.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('', {
          code: 'P2002',
          meta: { target: ['userId', 'name', 'type'] },
          clientVersion: '5.0.0',
        }),
      );

      await expect(
        service.create(userId, { name: 'Food', icon: '🍔', type: 'EXPENSE' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should filter by type', async () => {
      mockDb().category.findMany.mockResolvedValue([]);

      await service.findAll(userId, 'EXPENSE');

      expect(mockDb().category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId, type: 'EXPENSE' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when not found', async () => {
      mockDb().category.findUnique.mockResolvedValue(null);

      await expect(service.findOne('not-exist', userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
