import 'dotenv/config';
import { PrismaClient, CategoryType } from '@prisma/client';
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

async function seedCategories(userId: string, email: string) {
  const existing = await prisma.category.count({ where: { userId } });
  if (existing > 0) {
    console.log(`  Categories: already exist — skipping`);
    return;
  }

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

  await prisma.category.createMany({ data, skipDuplicates: true });
  console.log(`  Categories: seeded ${data.length} categories`);
}

async function seedWallets(userId: string, email: string) {
  const existing = await prisma.wallet.count({ where: { userId } });
  if (existing > 0) {
    console.log(`  Wallets: already exist — skipping`);
    return;
  }

  await prisma.wallet.createMany({
    data: DEFAULT_WALLETS.map((w) => ({ ...w, userId })),
    skipDuplicates: true,
  });
  console.log(`  Wallets: seeded ${DEFAULT_WALLETS.length} wallets`);
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
    await seedCategories(user.id, user.email);
    await seedWallets(user.id, user.email);
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
