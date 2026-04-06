import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaExceptionFilter } from '../src/prisma/prisma-exception.filter';
import { WalletModule } from '../src/wallet/wallet.module';
import { CategoryModule } from '../src/category/category.module';
import { TransactionModule } from '../src/transaction/transaction.module';
import { RecurringModule } from '../src/recurring/recurring.module';
import { BudgetModule } from '../src/budget/budget.module';
import { ReportModule } from '../src/report/report.module';
import { AppController } from '../src/app.controller';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { CanActivate, ExecutionContext, Module } from '@nestjs/common';

const MOCK_ADMIN_USER = {
  id: 'test-admin-id',
  email: 'admin@test.com',
  name: 'Test Admin',
  role: 'ADMIN',
};

const MOCK_VIEWER_USER = {
  id: 'test-viewer-id',
  email: 'viewer@test.com',
  name: 'Test Viewer',
  role: 'VIEWER',
};

let currentUser = MOCK_ADMIN_USER;

class MockSessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = currentUser;
    request.session = { id: 'test-session', userId: currentUser.id };
    return true;
  }
}

export function setTestUser(role: 'ADMIN' | 'VIEWER') {
  currentUser = role === 'ADMIN' ? MOCK_ADMIN_USER : MOCK_VIEWER_USER;
}

export function getTestUser() {
  return currentUser;
}

// Test module that skips AuthModule (better-auth is ESM-only, not compatible with Jest CJS)
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    WalletModule,
    CategoryModule,
    TransactionModule,
    RecurringModule,
    BudgetModule,
    ReportModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: MockSessionGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
class TestAppModule {}

export async function createTestApp(): Promise<INestApplication> {
  const module: TestingModule = await Test.createTestingModule({
    imports: [TestAppModule],
  }).compile();

  const app = module.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());

  await app.init();
  return app;
}

export async function cleanDatabase(app: INestApplication) {
  const prisma = app.get(PrismaService);
  // Delete in FK dependency order
  await prisma.db.budgetCategory.deleteMany();
  await prisma.db.budget.deleteMany();
  await prisma.db.recurring.deleteMany();
  await prisma.db.transaction.deleteMany();
  await prisma.db.category.deleteMany();
  await prisma.db.wallet.deleteMany();

  // Ensure test users exist
  await prisma.db.user.upsert({
    where: { email: MOCK_ADMIN_USER.email },
    update: {},
    create: {
      id: MOCK_ADMIN_USER.id,
      email: MOCK_ADMIN_USER.email,
      name: MOCK_ADMIN_USER.name,
      role: 'ADMIN',
    },
  });
  await prisma.db.user.upsert({
    where: { email: MOCK_VIEWER_USER.email },
    update: {},
    create: {
      id: MOCK_VIEWER_USER.id,
      email: MOCK_VIEWER_USER.email,
      name: MOCK_VIEWER_USER.name,
      role: 'VIEWER',
    },
  });
}
