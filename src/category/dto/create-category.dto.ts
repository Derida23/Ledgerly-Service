import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Nama kategori',
    example: 'Makanan & Minuman',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Ikon emoji kategori',
    example: '🍔',
  })
  @IsString()
  @IsNotEmpty()
  icon!: string;

  @ApiProperty({
    description: 'Tipe kategori',
    enum: ['INCOME', 'EXPENSE'],
    example: 'EXPENSE',
  })
  @IsEnum({ INCOME: 'INCOME', EXPENSE: 'EXPENSE' })
  type!: 'INCOME' | 'EXPENSE';
}
