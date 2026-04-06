import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateRecurringDto {
  @ApiPropertyOptional({ description: 'Nama reminder', example: 'Listrik' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ description: 'Jumlah (IDR)', example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @ApiPropertyOptional({ description: 'Tanggal tiap bulan (1-31)', example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @ApiPropertyOptional({ description: 'ID wallet sumber' })
  @IsOptional()
  @IsString()
  walletId?: string;

  @ApiPropertyOptional({ description: 'ID wallet tujuan (untuk transfer)' })
  @IsOptional()
  @IsString()
  targetWalletId?: string;

  @ApiPropertyOptional({ description: 'ID kategori (untuk expense)' })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
