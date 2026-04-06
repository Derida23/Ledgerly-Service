import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoryType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Makanan & Minuman', icon: '🍔' },
  { name: 'Transportasi', icon: '🚗' },
  { name: 'Belanja', icon: '🛒' },
  { name: 'Tagihan & Utilitas', icon: '💡' },
  { name: 'Hiburan', icon: '🎮' },
  { name: 'Kesehatan', icon: '💊' },
  { name: 'Pendidikan', icon: '📚' },
  { name: 'Keluarga', icon: '👨‍👩‍👧' },
  { name: 'Biaya Admin', icon: '🏦' },
  { name: 'Lainnya', icon: '📌' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Gaji', icon: '💰' },
  { name: 'Bonus', icon: '🎁' },
  { name: 'Cashback', icon: '💸' },
  { name: 'Lainnya', icon: '📌' },
];

const CATEGORY_SELECT = {
  id: true,
  name: true,
  icon: true,
  type: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async seedDefaults(userId: string) {
    const existing = await this.prisma.db.category.count({
      where: { userId },
    });

    if (existing > 0) return;

    const data = [
      ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
        ...c,
        type: CategoryType.EXPENSE,
        userId,
      })),
      ...DEFAULT_INCOME_CATEGORIES.map((c) => ({
        ...c,
        type: CategoryType.INCOME,
        userId,
      })),
    ];

    await this.prisma.db.category.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async create(userId: string, dto: CreateCategoryDto) {
    try {
      return await this.prisma.db.category.create({
        data: {
          name: dto.name,
          icon: dto.icon,
          type: dto.type as CategoryType,
          userId,
        },
        select: CATEGORY_SELECT,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          `Kategori "${dto.name}" (${dto.type}) sudah ada`,
        );
      }
      throw e;
    }
  }

  async findAll(userId: string, type?: 'INCOME' | 'EXPENSE') {
    return this.prisma.db.category.findMany({
      where: {
        userId,
        ...(type && { type: type as CategoryType }),
      },
      select: CATEGORY_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const category = await this.prisma.db.category.findUnique({
      where: { id },
      select: { ...CATEGORY_SELECT, userId: true },
    });

    if (!category || category.userId !== userId) {
      throw new NotFoundException('Kategori tidak ditemukan');
    }

    const { userId: _userId, ...rest } = category;
    return rest;
  }

  async update(id: string, userId: string, dto: UpdateCategoryDto) {
    await this.findOne(id, userId);

    try {
      return await this.prisma.db.category.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.icon !== undefined && { icon: dto.icon }),
        },
        select: CATEGORY_SELECT,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(`Kategori "${dto.name}" sudah ada`);
      }
      throw e;
    }
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    try {
      await this.prisma.db.category.delete({ where: { id } });
      return { message: 'Kategori berhasil dihapus' };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new ConflictException(
          'Kategori tidak bisa dihapus karena masih digunakan',
        );
      }
      throw e;
    }
  }
}
