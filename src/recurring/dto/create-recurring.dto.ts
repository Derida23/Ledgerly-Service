import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateRecurringDto {
  @ApiProperty({ description: 'Nama reminder', example: 'Listrik' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Tipe recurring',
    enum: ['EXPENSE', 'TRANSFER'],
    example: 'EXPENSE',
  })
  @IsEnum({ EXPENSE: 'EXPENSE', TRANSFER: 'TRANSFER' })
  type!: 'EXPENSE' | 'TRANSFER';

  @ApiProperty({ description: 'Jumlah (IDR)', example: 500000 })
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({ description: 'Tanggal tiap bulan (1-31)', example: 5 })
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth!: number;

  @ApiProperty({ description: 'ID wallet sumber', example: 'clx...' })
  @IsString()
  @IsNotEmpty()
  walletId!: string;

  @ApiPropertyOptional({
    description: 'ID wallet tujuan (untuk transfer)',
    example: 'clx...',
  })
  @IsOptional()
  @IsString()
  targetWalletId?: string;

  @ApiPropertyOptional({
    description: 'ID kategori (untuk expense)',
    example: 'clx...',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
