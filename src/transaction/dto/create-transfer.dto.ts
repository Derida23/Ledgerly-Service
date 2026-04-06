import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTransferDto {
  @ApiProperty({ description: 'Jumlah transfer (IDR)', example: 1000000 })
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({ description: 'ID wallet sumber', example: 'clx...' })
  @IsString()
  @IsNotEmpty()
  sourceWalletId!: string;

  @ApiProperty({ description: 'ID wallet tujuan', example: 'clx...' })
  @IsString()
  @IsNotEmpty()
  targetWalletId!: string;

  @ApiPropertyOptional({
    description: 'Biaya admin (IDR, default 0)',
    example: 6500,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  adminFee?: number;

  @ApiPropertyOptional({
    description: 'Tanggal transfer (default: hari ini)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Catatan', example: 'Transfer ke Jago' })
  @IsOptional()
  @IsString()
  note?: string;
}
