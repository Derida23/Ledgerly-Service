import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CategoryType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateBudgetDto) {
    try {
      const budget = await this.prisma.db.budget.create({
        data: {
          name: dto.name,
          limit: dto.limit,
          userId,
          categories: {
            create: dto.categoryIds.map((categoryId) => ({ categoryId })),
          },
        },
        select: { id: true },
      });

      return this.findOne(budget.id, userId);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(`Budget "${dto.name}" sudah ada`);
      }
      throw e;
    }
  }

  async findAll(userId: string) {
    const budgets = await this.prisma.db.budget.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        limit: true,
        createdAt: true,
        updatedAt: true,
        categories: {
          select: {
            category: { select: { id: true, name: true, icon: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    return Promise.all(
      budgets.map(async (budget) => {
        const categoryIds = budget.categories.map((c) => c.category.id);
        const spent = await this.calculateSpent(
          userId,
          categoryIds,
          startOfMonth,
          endOfMonth,
        );
        return this.formatBudgetResponse(budget, spent);
      }),
    );
  }

  async findOne(id: string, userId: string) {
    const budget = await this.prisma.db.budget.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        limit: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        categories: {
          select: {
            category: { select: { id: true, name: true, icon: true } },
          },
        },
      },
    });

    if (!budget || budget.userId !== userId) {
      throw new NotFoundException('Budget tidak ditemukan');
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const categoryIds = budget.categories.map((c) => c.category.id);
    const spent = await this.calculateSpent(
      userId,
      categoryIds,
      startOfMonth,
      endOfMonth,
    );

    return this.formatBudgetResponse(budget, spent);
  }

  async update(id: string, userId: string, dto: UpdateBudgetDto) {
    await this.findOne(id, userId);

    try {
      await this.prisma.db.$transaction(async (tx) => {
        await tx.budget.update({
          where: { id },
          data: {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.limit !== undefined && { limit: dto.limit }),
          },
        });

        if (dto.categoryIds) {
          await tx.budgetCategory.deleteMany({ where: { budgetId: id } });
          await tx.budgetCategory.createMany({
            data: dto.categoryIds.map((categoryId) => ({
              budgetId: id,
              categoryId,
            })),
          });
        }
      });

      return this.findOne(id, userId);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(`Budget "${dto.name}" sudah ada`);
      }
      throw e;
    }
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.db.budget.delete({ where: { id } });
    return { message: 'Budget berhasil dihapus' };
  }

  async seedDefaults(userId: string) {
    const existing = await this.prisma.db.budget.count({
      where: { userId },
    });
    if (existing > 0) return;

    const categories = await this.prisma.db.category.findMany({
      where: {
        userId,
        type: CategoryType.EXPENSE,
        name: { in: ['Makanan & Minuman', 'Transportasi'] },
      },
      select: { id: true },
    });

    if (categories.length === 0) return;

    await this.prisma.db.budget.create({
      data: {
        name: 'Budget Bulanan',
        limit: 1000000,
        userId,
        categories: {
          create: categories.map((c) => ({ categoryId: c.id })),
        },
      },
    });
  }

  private async calculateSpent(
    userId: string,
    categoryIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    if (categoryIds.length === 0) return 0;

    const result = await this.prisma.db.transaction.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
        categoryId: { in: categoryIds },
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    return Number(result._sum.amount ?? 0);
  }

  private formatBudgetResponse(
    budget: {
      id: string;
      name: string;
      limit: Prisma.Decimal;
      createdAt: Date;
      updatedAt: Date;
      userId?: string;
      categories: { category: { id: string; name: string; icon: string } }[];
    },
    spent: number,
  ) {
    const limitNum = Number(budget.limit);
    const remaining = limitNum - spent;
    const percentage = limitNum > 0 ? Math.round((spent / limitNum) * 100) : 0;

    let status: 'NORMAL' | 'WARNING' | 'OVER_BUDGET';
    if (percentage > 100) {
      status = 'OVER_BUDGET';
    } else if (percentage >= 80) {
      status = 'WARNING';
    } else {
      status = 'NORMAL';
    }

    return {
      id: budget.id,
      name: budget.name,
      limit: limitNum,
      spent,
      remaining,
      percentage,
      status,
      categories: budget.categories.map((c) => c.category),
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    };
  }
}
