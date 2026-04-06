import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';

export class QueryTransactionDto {
  @ApiPropertyOptional({
    description: 'Filter by tipe',
    enum: ['INCOME', 'EXPENSE', 'TRANSFER_IN', 'TRANSFER_OUT'],
  })
  @IsOptional()
  @IsEnum({
    INCOME: 'INCOME',
    EXPENSE: 'EXPENSE',
    TRANSFER_IN: 'TRANSFER_IN',
    TRANSFER_OUT: 'TRANSFER_OUT',
  })
  type?: string;

  @ApiPropertyOptional({ description: 'Filter by wallet ID' })
  @IsOptional()
  @IsString()
  walletId?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Tanggal mulai (YYYY-MM-DD)', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Tanggal akhir (YYYY-MM-DD)', example: '2024-01-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Halaman (default 1)', example: '1' })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ description: 'Jumlah per halaman (default 20)', example: '20' })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}
