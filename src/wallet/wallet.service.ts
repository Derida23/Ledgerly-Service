import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  async seedDefaults(userId: string) {
    const existing = await this.prisma.db.wallet.count({ where: { userId } });
    if (existing > 0) return;

    const defaultWallets = [
      { name: 'Bank Mandiri', initialBalance: 0 },
      { name: 'Bank Jago', initialBalance: 0 },
      { name: 'Bank Jago Syariah', initialBalance: 0 },
      { name: 'Bank BCA', initialBalance: 0 },
      { name: 'ShopeePay', initialBalance: 0 },
      { name: 'OVO', initialBalance: 0 },
      { name: 'Bibit', initialBalance: 0 },
    ];

    await this.prisma.db.wallet.createMany({
      data: defaultWallets.map((w) => ({ ...w, userId })),
      skipDuplicates: true,
    });
  }

  async create(userId: string, dto: CreateWalletDto) {
    try {
      return await this.prisma.db.wallet.create({
        data: {
          name: dto.name,
          initialBalance: dto.initialBalance ?? 0,
          userId,
        },
        select: {
          id: true,
          name: true,
          initialBalance: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(`Wallet "${dto.name}" sudah ada`);
      }
      throw e;
    }
  }

  async findAll(userId: string) {
    const wallets = await this.prisma.db.wallet.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        initialBalance: true,
        createdAt: true,
        updatedAt: true,
        transactions: {
          select: {
            amount: true,
            type: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return wallets.map((wallet) => {
      const balance = this.calculateBalance(
        wallet.initialBalance,
        wallet.transactions,
      );
      const { transactions: _, ...rest } = wallet;
      return { ...rest, balance };
    });
  }

  async findOne(id: string, userId: string) {
    const wallet = await this.prisma.db.wallet.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        initialBalance: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        transactions: {
          select: {
            amount: true,
            type: true,
          },
        },
      },
    });

    if (!wallet || wallet.userId !== userId) {
      throw new NotFoundException('Wallet tidak ditemukan');
    }

    const balance = this.calculateBalance(
      wallet.initialBalance,
      wallet.transactions,
    );
    const { transactions: _, userId: __, ...rest } = wallet;
    return { ...rest, balance };
  }

  async update(id: string, userId: string, dto: UpdateWalletDto) {
    await this.findOne(id, userId);

    try {
      const updated = await this.prisma.db.wallet.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.initialBalance !== undefined && {
            initialBalance: dto.initialBalance,
          }),
        },
        select: {
          id: true,
          name: true,
          initialBalance: true,
          createdAt: true,
          updatedAt: true,
          transactions: {
            select: {
              amount: true,
              type: true,
            },
          },
        },
      });

      const balance = this.calculateBalance(
        updated.initialBalance,
        updated.transactions,
      );
      const { transactions: _, ...rest } = updated;
      return { ...rest, balance };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(`Wallet "${dto.name}" sudah ada`);
      }
      throw e;
    }
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    try {
      await this.prisma.db.wallet.delete({ where: { id } });
      return { message: 'Wallet berhasil dihapus' };
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new ConflictException(
          'Wallet tidak bisa dihapus karena masih memiliki transaksi',
        );
      }
      throw e;
    }
  }

  private calculateBalance(
    initialBalance: Prisma.Decimal,
    transactions: { amount: Prisma.Decimal; type: string }[],
  ): number {
    let balance = Number(initialBalance);

    for (const tx of transactions) {
      const amount = Number(tx.amount);
      if (tx.type === 'INCOME' || tx.type === 'TRANSFER_IN') {
        balance += amount;
      } else {
        balance -= amount;
      }
    }

    return balance;
  }
}
