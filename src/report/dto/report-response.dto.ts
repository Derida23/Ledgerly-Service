import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryBreakdownDto {
  @ApiProperty({ example: 'clx...' })
  categoryId!: string;

  @ApiProperty({ example: 'Makanan & Minuman' })
  categoryName!: string;

  @ApiProperty({ example: '🍔' })
  categoryIcon!: string;

  @ApiProperty({ example: 350000 })
  total!: number;

  @ApiProperty({ example: 5 })
  count!: number;
}

export class WalletBreakdownDto {
  @ApiProperty({ example: 'clx...' })
  walletId!: string;

  @ApiProperty({ example: 'Bank Mandiri' })
  walletName!: string;

  @ApiProperty({ example: 500000, description: 'Total pengeluaran dari wallet ini' })
  totalExpense!: number;

  @ApiProperty({ example: 8500000, description: 'Total pemasukan ke wallet ini' })
  totalIncome!: number;
}

export class MonthlyTrendDto {
  @ApiProperty({ example: '2024-01' })
  month!: string;

  @ApiProperty({ example: 8500000 })
  income!: number;

  @ApiProperty({ example: 3200000 })
  expense!: number;
}

export class WalletBalanceDto {
  @ApiProperty({ example: 'clx...' })
  id!: string;

  @ApiProperty({ example: 'Bank Mandiri' })
  name!: string;

  @ApiProperty({ example: 5000000 })
  balance!: number;
}

export class ReportResponseDto {
  @ApiProperty({ example: 'monthly' })
  period!: string;

  @ApiProperty({ example: '2024-01-01' })
  startDate!: string;

  @ApiProperty({ example: '2024-01-31' })
  endDate!: string;

  @ApiProperty({ example: 8500000 })
  totalIncome!: number;

  @ApiProperty({ example: 3200000 })
  totalExpense!: number;

  @ApiProperty({ example: 5300000, description: 'Surplus (positif) atau defisit (negatif)' })
  balance!: number;

  @ApiProperty({ type: [CategoryBreakdownDto] })
  categoryBreakdown!: CategoryBreakdownDto[];

  @ApiProperty({ type: [WalletBreakdownDto] })
  walletBreakdown!: WalletBreakdownDto[];

  @ApiPropertyOptional({
    description: 'Perubahan vs periode sebelumnya (hanya untuk bulanan)',
    example: { incomeChange: 5.2, expenseChange: -3.1 },
  })
  comparison?: { incomeChange: number; expenseChange: number };
}

export class DashboardResponseDto {
  @ApiProperty({ example: 25500000, description: 'Total saldo semua wallet' })
  totalBalance!: number;

  @ApiProperty({ type: [WalletBalanceDto] })
  wallets!: WalletBalanceDto[];

  @ApiProperty({ type: [MonthlyTrendDto], description: 'Tren 12 bulan terakhir' })
  monthlyTrend!: MonthlyTrendDto[];
}
