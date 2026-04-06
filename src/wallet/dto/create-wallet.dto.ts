import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateWalletDto {
  @ApiProperty({
    description: 'Nama wallet',
    example: 'Bank Mandiri',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Saldo awal (IDR)',
    example: 5000000,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialBalance?: number;
}
