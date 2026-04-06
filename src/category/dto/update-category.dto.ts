import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    description: 'Nama kategori',
    example: 'Makanan & Minuman',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    description: 'Ikon emoji kategori',
    example: '🍔',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  icon?: string;
}
