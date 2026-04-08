import 'dotenv/config';
import { PrismaClient, CategoryType, RecurringType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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

const DEFAULT_WALLETS = [
  { name: 'Bank Mandiri', initialBalance: 0 },
  { name: 'Bank Jago', initialBalance: 0 },
  { name: 'Bank Jago Syariah', initialBalance: 0 },
  { name: 'Bank BCA', initialBalance: 0 },
  { name: 'ShopeePay', initialBalance: 0 },
  { name: 'OVO', initialBalance: 0 },
  { name: 'Bibit', initialBalance: 0 },
];

// Recurring reminders dari CLAUDE.md
const DEFAULT_RECURRINGS = [
  { name: 'Bibit', type: RecurringType.TRANSFER, amount: 500000, dayOfMonth: 1, walletName: 'Bank Jago', targetWalletName: 'Bibit', categoryName: null },
  { name: 'Transfer istri', type: RecurringType.EXPENSE, amount: 1000000, dayOfMonth: 1, walletName: 'Bank Jago Syariah', targetWalletName: null, categoryName: 'Keluarga' },
  { name: 'Listrik', type: RecurringType.EXPENSE, amount: 500000, dayOfMonth: 5, walletName: 'Bank Mandiri', targetWalletName: null, categoryName: 'Tagihan & Utilitas' },
  { name: 'WiFi', type: RecurringType.EXPENSE, amount: 300000, dayOfMonth: 5, walletName: 'Bank Mandiri', targetWalletName: null, categoryName: 'Tagihan & Utilitas' },
  { name: 'Admin Mandiri', type: RecurringType.EXPENSE, amount: 10000, dayOfMonth: 1, walletName: 'Bank Mandiri', targetWalletName: null, categoryName: 'Biaya Admin' },
  { name: 'Admin BCA', type: RecurringType.EXPENSE, amount: 15000, dayOfMonth: 1, walletName: 'Bank BCA', targetWalletName: null, categoryName: 'Biaya Admin' },
];

// Budget dari CLAUDE.md — Makanan + Transportasi, 1jt/bulan
const DEFAULT_BUDGET = {
  name: 'Budget Bulanan',
  limit: 1000000,
  categoryNames: ['Makanan & Minuman', 'Transportasi'],
};

async function seedCategories(userId: string) {
  const existing = await prisma.category.count({ where: { userId } });
  if (existing > 0) {
    console.log('  Categories: already exist — skipping');
    return;
  }

  const data = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c, type: CategoryType.EXPENSE, userId })),
    ...DEFAULT_INCOME_CATEGORIES.map((c) => ({ ...c, type: CategoryType.INCOME, userId })),
  ];

  await prisma.category.createMany({ data, skipDuplicates: true });
  console.log(`  Categories: seeded ${data.length} categories`);
}

async function seedWallets(userId: string) {
  const existing = await prisma.wallet.count({ where: { userId } });
  if (existing > 0) {
    console.log('  Wallets: already exist — skipping');
    return;
  }

  await prisma.wallet.createMany({
    data: DEFAULT_WALLETS.map((w) => ({ ...w, userId })),
    skipDuplicates: true,
  });
  console.log(`  Wallets: seeded ${DEFAULT_WALLETS.length} wallets`);
}

async function seedRecurrings(userId: string) {
  const existing = await prisma.recurring.count({ where: { userId } });
  if (existing > 0) {
    console.log('  Recurrings: already exist — skipping');
    return;
  }

  const wallets = await prisma.wallet.findMany({
    where: { userId },
    select: { id: true, name: true },
  });
  const categories = await prisma.category.findMany({
    where: { userId, type: CategoryType.EXPENSE },
    select: { id: true, name: true },
  });

  const walletMap = new Map(wallets.map((w) => [w.name, w.id]));
  const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

  let seeded = 0;
  for (const r of DEFAULT_RECURRINGS) {
    const walletId = walletMap.get(r.walletName);
    if (!walletId) continue;

    const targetWalletId = r.targetWalletName ? walletMap.get(r.targetWalletName) ?? null : null;
    const categoryId = r.categoryName ? categoryMap.get(r.categoryName) ?? null : null;

    await prisma.recurring.create({
      data: {
        name: r.name,
        type: r.type,
        amount: r.amount,
        dayOfMonth: r.dayOfMonth,
        walletId,
        targetWalletId,
        categoryId,
        userId,
      },
    });
    seeded++;
  }

  console.log(`  Recurrings: seeded ${seeded} reminders`);
}

async function seedBudget(userId: string) {
  const existing = await prisma.budget.count({ where: { userId } });
  if (existing > 0) {
    console.log('  Budget: already exist — skipping');
    return;
  }

  const categories = await prisma.category.findMany({
    where: {
      userId,
      type: CategoryType.EXPENSE,
      name: { in: DEFAULT_BUDGET.categoryNames },
    },
    select: { id: true, name: true },
  });

  if (categories.length === 0) {
    console.log('  Budget: no matching categories found — skipping');
    return;
  }

  await prisma.budget.create({
    data: {
      name: DEFAULT_BUDGET.name,
      limit: DEFAULT_BUDGET.limit,
      userId,
      categories: {
        create: categories.map((c) => ({ categoryId: c.id })),
      },
    },
  });

  console.log(`  Budget: seeded "${DEFAULT_BUDGET.name}" with ${categories.length} categories`);
}

async function main() {
  console.log('Seeding database...\n');

  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  });

  if (users.length === 0) {
    console.log('No users found — skipping seed (will be seeded on first login)');
    return;
  }

  for (const user of users) {
    console.log(`User: ${user.email}`);
    await seedCategories(user.id);
    await seedWallets(user.id);
    await seedRecurrings(user.id);
    await seedBudget(user.id);
    console.log('');
  }

  console.log('Seeding complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
