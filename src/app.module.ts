import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { CategoryModule } from './category/category.module';
import { TransactionModule } from './transaction/transaction.module';
import { RecurringModule } from './recurring/recurring.module';
import { BudgetModule } from './budget/budget.module';
import { ReportModule } from './report/report.module';
import { SessionGuard } from './auth/guards/session.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    WalletModule,
    CategoryModule,
    TransactionModule,
    RecurringModule,
    BudgetModule,
    ReportModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(json(), urlencoded({ extended: true }))
      .exclude('api/auth/*path')
      .forRoutes('*');
  }
}
