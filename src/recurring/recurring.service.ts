import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoryType, RecurringType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';

const RECURRING_SELECT = {
  id: true,
  name: true,
  type: true,
  amount: true,
  dayOfMonth: true,
  createdAt: true,
  updatedAt: true,
  wallet: { select: { id: true, name: true } },
  targetWallet: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, icon: true } },
} as const;

@Injectable()
export class RecurringService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateRecurringDto) {
    if (dto.type === 'TRANSFER' && !dto.targetWalletId) {
      throw new BadRequestException('Wallet tujuan wajib untuk tipe transfer');
    }
    if (dto.type === 'EXPENSE' && !dto.categoryId) {
      throw new BadRequestException('Kategori wajib untuk tipe expense');
    }

    return this.prisma.db.recurring.create({
      data: {
        name: dto.name,
        type: dto.type as RecurringType,
        amount: dto.amount,
        dayOfMonth: dto.dayOfMonth,
        walletId: dto.walletId,
        targetWalletId: dto.targetWalletId ?? null,
        categoryId: dto.categoryId ?? null,
        userId,
      },
      select: RECURRING_SELECT,
    });
  }

  async findAll(userId: string) {
    return this.prisma.db.recurring.findMany({
      where: { userId },
      select: RECURRING_SELECT,
      orderBy: { dayOfMonth: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const recurring = await this.prisma.db.recurring.findUnique({
      where: { id },
      select: { ...RECURRING_SELECT, userId: true },
    });

    if (!recurring || recurring.userId !== userId) {
      throw new NotFoundException('Recurring tidak ditemukan');
    }

    const { userId: _userId, ...rest } = recurring;
    return rest;
  }

  async update(id: string, userId: string, dto: UpdateRecurringDto) {
    await this.findOne(id, userId);

    return this.prisma.db.recurring.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.dayOfMonth !== undefined && { dayOfMonth: dto.dayOfMonth }),
        ...(dto.walletId !== undefined && { walletId: dto.walletId }),
        ...(dto.targetWalletId !== undefined && {
          targetWalletId: dto.targetWalletId,
        }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      },
      select: RECURRING_SELECT,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.db.recurring.delete({ where: { id } });
    return { message: 'Recurring berhasil dihapus' };
  }

  async findDueToday(userId: string) {
    const today = new Date().getDate();
    return this.prisma.db.recurring.findMany({
      where: { userId, dayOfMonth: today },
      select: RECURRING_SELECT,
    });
  }

  async seedDefaults(userId: string) {
    const existing = await this.prisma.db.recurring.count({
      where: { userId },
    });
    if (existing > 0) return;

    const wallets = await this.prisma.db.wallet.findMany({
      where: { userId },
      select: { id: true, name: true },
    });
    const categories = await this.prisma.db.category.findMany({
      where: { userId, type: CategoryType.EXPENSE },
      select: { id: true, name: true },
    });

    const walletMap = new Map(wallets.map((w) => [w.name, w.id]));
    const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

    const defaults = [
      {
        name: 'Bibit',
        type: RecurringType.TRANSFER,
        amount: 500000,
        dayOfMonth: 1,
        walletName: 'Bank Jago',
        targetWalletName: 'Bibit',
        categoryName: null,
      },
      {
        name: 'Transfer istri',
        type: RecurringType.EXPENSE,
        amount: 1000000,
        dayOfMonth: 1,
        walletName: 'Bank Jago Syariah',
        targetWalletName: null,
        categoryName: 'Keluarga',
      },
      {
        name: 'Listrik',
        type: RecurringType.EXPENSE,
        amount: 500000,
        dayOfMonth: 5,
        walletName: 'Bank Mandiri',
        targetWalletName: null,
        categoryName: 'Tagihan & Utilitas',
      },
      {
        name: 'WiFi',
        type: RecurringType.EXPENSE,
        amount: 300000,
        dayOfMonth: 5,
        walletName: 'Bank Mandiri',
        targetWalletName: null,
        categoryName: 'Tagihan & Utilitas',
      },
      {
        name: 'Admin Mandiri',
        type: RecurringType.EXPENSE,
        amount: 10000,
        dayOfMonth: 1,
        walletName: 'Bank Mandiri',
        targetWalletName: null,
        categoryName: 'Biaya Admin',
      },
      {
        name: 'Admin BCA',
        type: RecurringType.EXPENSE,
        amount: 15000,
        dayOfMonth: 1,
        walletName: 'Bank BCA',
        targetWalletName: null,
        categoryName: 'Biaya Admin',
      },
    ];

    for (const r of defaults) {
      const walletId = walletMap.get(r.walletName);
      if (!walletId) continue;

      await this.prisma.db.recurring.create({
        data: {
          name: r.name,
          type: r.type,
          amount: r.amount,
          dayOfMonth: r.dayOfMonth,
          walletId,
          targetWalletId: r.targetWalletName
            ? (walletMap.get(r.targetWalletName) ?? null)
            : null,
          categoryId: r.categoryName
            ? (categoryMap.get(r.categoryName) ?? null)
            : null,
          userId,
        },
      });
    }
  }
}
