import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ description: 'Jumlah (IDR)', example: 50000 })
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({
    description: 'Tipe transaksi',
    enum: ['INCOME', 'EXPENSE'],
    example: 'EXPENSE',
  })
  @IsEnum({ INCOME: 'INCOME', EXPENSE: 'EXPENSE' })
  type!: 'INCOME' | 'EXPENSE';

  @ApiProperty({ description: 'ID wallet sumber', example: 'clx...' })
  @IsString()
  @IsNotEmpty()
  walletId!: string;

  @ApiProperty({ description: 'ID kategori', example: 'clx...' })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @ApiPropertyOptional({
    description: 'Metode pembayaran (wajib untuk EXPENSE)',
    enum: ['CASH', 'QRIS', 'TRANSFER', 'DEBIT'],
    example: 'QRIS',
  })
  @IsOptional()
  @IsEnum({ CASH: 'CASH', QRIS: 'QRIS', TRANSFER: 'TRANSFER', DEBIT: 'DEBIT' })
  method?: 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT';

  @ApiPropertyOptional({
    description: 'Tanggal transaksi (default: hari ini)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Catatan', example: 'Makan siang' })
  @IsOptional()
  @IsString()
  note?: string;
}
