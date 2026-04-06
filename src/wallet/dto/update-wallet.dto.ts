import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateWalletDto {
  @ApiPropertyOptional({
    description: 'Nama wallet',
    example: 'Bank Mandiri',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    description: 'Saldo awal (IDR)',
    example: 5000000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialBalance?: number;
}
