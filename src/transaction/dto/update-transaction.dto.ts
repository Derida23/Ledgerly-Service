import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateTransactionDto {
  @ApiPropertyOptional({ description: 'Jumlah (IDR)', example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @ApiPropertyOptional({
    description: 'ID kategori',
    example: 'clx...',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Metode pembayaran',
    enum: ['CASH', 'QRIS', 'TRANSFER', 'DEBIT'],
  })
  @IsOptional()
  @IsEnum({ CASH: 'CASH', QRIS: 'QRIS', TRANSFER: 'TRANSFER', DEBIT: 'DEBIT' })
  method?: 'CASH' | 'QRIS' | 'TRANSFER' | 'DEBIT';

  @ApiPropertyOptional({
    description: 'Tanggal transaksi',
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
