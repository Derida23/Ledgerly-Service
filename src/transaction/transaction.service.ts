import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TransactionType, PaymentMethod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';

const TRANSACTION_SELECT = {
  id: true,
  amount: true,
  type: true,
  method: true,
  date: true,
  note: true,
  transferPairId: true,
  createdAt: true,
  updatedAt: true,
  wallet: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, icon: true } },
} as const;

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto) {
    if (dto.type === 'EXPENSE' && !dto.method) {
      throw new BadRequestException('Metode pembayaran wajib untuk pengeluaran');
    }

    return this.prisma.db.transaction.create({
      data: {
        amount: dto.amount,
        type: dto.type as TransactionType,
        method: dto.method ? (dto.method as PaymentMethod) : null,
        date: dto.date ? new Date(dto.date) : new Date(),
        note: dto.note,
        walletId: dto.walletId,
        categoryId: dto.categoryId,
        userId,
      },
      select: TRANSACTION_SELECT,
    });
  }

  async createTransfer(userId: string, dto: CreateTransferDto) {
    if (dto.sourceWalletId === dto.targetWalletId) {
      throw new BadRequestException('Wallet sumber dan tujuan tidak boleh sama');
    }

    const date = dto.date ? new Date(dto.date) : new Date();

    return this.prisma.db.$transaction(async (tx) => {
      // Record 1: Transfer Keluar
      const transferOut = await tx.transaction.create({
        data: {
          amount: dto.amount,
          type: TransactionType.TRANSFER_OUT,
          date,
          note: dto.note,
          walletId: dto.sourceWalletId,
          userId,
        },
      });

      // Record 2: Transfer Masuk
      const transferIn = await tx.transaction.create({
        data: {
          amount: dto.amount,
          type: TransactionType.TRANSFER_IN,
          date,
          note: dto.note,
          walletId: dto.targetWalletId,
          transferPairId: transferOut.id,
          userId,
        },
      });

      // Link transfer out → transfer in
      await tx.transaction.update({
        where: { id: transferOut.id },
        data: { transferPairId: transferIn.id },
      });

      // Record 3: Biaya admin (jika ada)
      let adminTransaction = null;
      if (dto.adminFee && dto.adminFee > 0) {
        // Cari kategori "Biaya Admin" milik user
        const adminCategory = await tx.category.findFirst({
          where: { userId, name: 'Biaya Admin', type: 'EXPENSE' },
          select: { id: true },
        });

        adminTransaction = await tx.transaction.create({
          data: {
            amount: dto.adminFee,
            type: TransactionType.EXPENSE,
            method: PaymentMethod.TRANSFER,
            date,
            note: 'Biaya admin transfer',
            walletId: dto.sourceWalletId,
            categoryId: adminCategory?.id ?? null,
            userId,
          },
        });
      }

      // Fetch complete data for response
      const result = await tx.transaction.findMany({
        where: {
          id: {
            in: [
              transferOut.id,
              transferIn.id,
              ...(adminTransaction ? [adminTransaction.id] : []),
            ],
          },
        },
        select: TRANSACTION_SELECT,
        orderBy: { createdAt: 'asc' },
      });

      return result;
    });
  }

  async findAll(userId: string, query: QueryTransactionDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(query.type && { type: query.type as TransactionType }),
      ...(query.walletId && { walletId: query.walletId }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...((query.startDate || query.endDate) && {
        date: {
          ...(query.startDate && { gte: new Date(query.startDate) }),
          ...(query.endDate && {
            lte: new Date(query.endDate + 'T23:59:59.999Z'),
          }),
        },
      }),
    };

    const [data, total] = await this.prisma.db.$transaction([
      this.prisma.db.transaction.findMany({
        where,
        select: TRANSACTION_SELECT,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.db.transaction.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string) {
    const transaction = await this.prisma.db.transaction.findUnique({
      where: { id },
      select: { ...TRANSACTION_SELECT, userId: true },
    });

    if (!transaction || transaction.userId !== userId) {
      throw new NotFoundException('Transaksi tidak ditemukan');
    }

    const { userId: _, ...rest } = transaction;
    return rest;
  }

  async update(id: string, userId: string, dto: UpdateTransactionDto) {
    const existing = await this.findOne(id, userId);

    // Jika transfer pair, update juga pair-nya
    if (
      (existing.type === 'TRANSFER_IN' || existing.type === 'TRANSFER_OUT') &&
      existing.transferPairId &&
      dto.amount !== undefined
    ) {
      return this.prisma.db.$transaction(async (tx) => {
        const updated = await tx.transaction.update({
          where: { id },
          data: {
            ...(dto.amount !== undefined && { amount: dto.amount }),
            ...(dto.date !== undefined && { date: new Date(dto.date) }),
            ...(dto.note !== undefined && { note: dto.note }),
          },
          select: TRANSACTION_SELECT,
        });

        // Update pair amount + date juga
        await tx.transaction.update({
          where: { id: existing.transferPairId! },
          data: {
            ...(dto.amount !== undefined && { amount: dto.amount }),
            ...(dto.date !== undefined && { date: new Date(dto.date) }),
            ...(dto.note !== undefined && { note: dto.note }),
          },
        });

        return updated;
      });
    }

    return this.prisma.db.transaction.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.method !== undefined && {
          method: dto.method as PaymentMethod,
        }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.note !== undefined && { note: dto.note }),
      },
      select: TRANSACTION_SELECT,
    });
  }

  async remove(id: string, userId: string) {
    const existing = await this.findOne(id, userId);

    // Jika transfer, hapus pair-nya juga
    if (
      (existing.type === 'TRANSFER_IN' || existing.type === 'TRANSFER_OUT') &&
      existing.transferPairId
    ) {
      await this.prisma.db.$transaction(async (tx) => {
        // Unlink dulu supaya bisa delete
        await tx.transaction.update({
          where: { id },
          data: { transferPairId: null },
        });
        await tx.transaction.update({
          where: { id: existing.transferPairId! },
          data: { transferPairId: null },
        });
        // Delete both
        await tx.transaction.deleteMany({
          where: { id: { in: [id, existing.transferPairId!] } },
        });
      });

      return { message: 'Transfer berhasil dihapus (kedua record)' };
    }

    await this.prisma.db.transaction.delete({ where: { id } });
    return { message: 'Transaksi berhasil dihapus' };
  }
}
