import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getReport(
    userId: string,
    period: 'weekly' | 'monthly' | 'yearly',
    dateParam?: string,
  ) {
    const { startDate, endDate } = this.getDateRange(period, dateParam);

    const [income, expense, categoryBreakdown, walletBreakdown] =
      await Promise.all([
        this.getTotal(userId, 'INCOME', startDate, endDate),
        this.getTotal(userId, 'EXPENSE', startDate, endDate),
        this.getCategoryBreakdown(userId, startDate, endDate),
        this.getWalletBreakdown(userId, startDate, endDate),
      ]);

    const result: Record<string, unknown> = {
      period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      categoryBreakdown,
      walletBreakdown,
    };

    if (period === 'monthly') {
      const prevStart = new Date(startDate);
      prevStart.setMonth(prevStart.getMonth() - 1);
      const prevEnd = new Date(endDate);
      prevEnd.setMonth(prevEnd.getMonth() - 1);

      const [prevIncome, prevExpense] = await Promise.all([
        this.getTotal(userId, 'INCOME', prevStart, prevEnd),
        this.getTotal(userId, 'EXPENSE', prevStart, prevEnd),
      ]);

      result.comparison = {
        incomeChange:
          prevIncome > 0
            ? Math.round(((income - prevIncome) / prevIncome) * 100 * 10) / 10
            : 0,
        expenseChange:
          prevExpense > 0
            ? Math.round(((expense - prevExpense) / prevExpense) * 100 * 10) /
              10
            : 0,
      };
    }

    return result;
  }

  async getDashboard(userId: string) {
    const [wallets, monthlyTrend] = await Promise.all([
      this.getWalletBalances(userId),
      this.getMonthlyTrend(userId),
    ]);

    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

    return {
      totalBalance,
      wallets,
      monthlyTrend,
    };
  }

  private async getTotal(
    userId: string,
    type: TransactionType,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.db.transaction.aggregate({
      where: {
        userId,
        type,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  private async getCategoryBreakdown(
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const groups = await this.prisma.db.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        categoryId: { not: null },
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });

    const categoryIds = groups
      .map((g) => g.categoryId)
      .filter((id): id is string => id !== null);

    const categories = await this.prisma.db.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, icon: true },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    return groups.map((g) => {
      const cat = categoryMap.get(g.categoryId!);
      return {
        categoryId: g.categoryId!,
        categoryName: cat?.name ?? 'Unknown',
        categoryIcon: cat?.icon ?? '📌',
        total: Number(g._sum.amount ?? 0),
        count: g._count,
      };
    });
  }

  private async getWalletBreakdown(
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const groups = await this.prisma.db.transaction.groupBy({
      by: ['walletId', 'type'],
      where: {
        userId,
        type: { in: ['INCOME', 'EXPENSE'] },
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    const walletIds = [...new Set(groups.map((g) => g.walletId))];
    const wallets = await this.prisma.db.wallet.findMany({
      where: { id: { in: walletIds } },
      select: { id: true, name: true },
    });

    const walletMap = new Map(wallets.map((w) => [w.id, w]));
    const breakdown = new Map<
      string,
      { totalExpense: number; totalIncome: number }
    >();

    for (const g of groups) {
      const existing = breakdown.get(g.walletId) ?? {
        totalExpense: 0,
        totalIncome: 0,
      };
      const amount = Number(g._sum.amount ?? 0);
      if (g.type === 'EXPENSE') {
        existing.totalExpense += amount;
      } else {
        existing.totalIncome += amount;
      }
      breakdown.set(g.walletId, existing);
    }

    return walletIds.map((id) => {
      const wallet = walletMap.get(id);
      const data = breakdown.get(id) ?? { totalExpense: 0, totalIncome: 0 };
      return {
        walletId: id,
        walletName: wallet?.name ?? 'Unknown',
        ...data,
      };
    });
  }

  private async getWalletBalances(userId: string) {
    const wallets = await this.prisma.db.wallet.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        initialBalance: true,
        transactions: {
          select: { amount: true, type: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return wallets.map((w) => {
      let balance = Number(w.initialBalance);
      for (const tx of w.transactions) {
        const amount = Number(tx.amount);
        if (tx.type === 'INCOME' || tx.type === 'TRANSFER_IN') {
          balance += amount;
        } else {
          balance -= amount;
        }
      }
      return { id: w.id, name: w.name, balance };
    });
  }

  private async getMonthlyTrend(userId: string) {
    const now = new Date();
    const months: { month: string; income: number; expense: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        0,
        23,
        59,
        59,
        999,
      );
      const monthStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;

      const [income, expense] = await Promise.all([
        this.getTotal(userId, TransactionType.INCOME, start, end),
        this.getTotal(userId, TransactionType.EXPENSE, start, end),
      ]);

      months.push({ month: monthStr, income, expense });
    }

    return months;
  }

  private getDateRange(
    period: 'weekly' | 'monthly' | 'yearly',
    dateParam?: string,
  ) {
    const now = dateParam ? new Date(dateParam) : new Date();

    switch (period) {
      case 'weekly': {
        const day = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        return { startDate: monday, endDate: sunday };
      }
      case 'monthly': {
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
        return { startDate, endDate };
      }
      case 'yearly': {
        const startDate = new Date(now.getFullYear(), 0, 1);
        const endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        return { startDate, endDate };
      }
    }
  }
}
