import { ApiProperty } from '@nestjs/swagger';

export class BudgetCategoryDto {
  @ApiProperty({ example: 'clx...' })
  id!: string;

  @ApiProperty({ example: 'Makanan & Minuman' })
  name!: string;

  @ApiProperty({ example: '🍔' })
  icon!: string;
}

export class BudgetResponseDto {
  @ApiProperty({ example: 'clx...' })
  id!: string;

  @ApiProperty({ example: 'Budget Bulanan' })
  name!: string;

  @ApiProperty({ example: 1000000, description: 'Limit per bulan (IDR)' })
  limit!: number;

  @ApiProperty({ example: 750000, description: 'Total terpakai bulan ini' })
  spent!: number;

  @ApiProperty({ example: 250000, description: 'Sisa budget' })
  remaining!: number;

  @ApiProperty({ example: 75, description: 'Persentase terpakai' })
  percentage!: number;

  @ApiProperty({
    enum: ['NORMAL', 'WARNING', 'OVER_BUDGET'],
    example: 'NORMAL',
    description: 'NORMAL (<80%), WARNING (>=80%), OVER_BUDGET (>100%)',
  })
  status!: string;

  @ApiProperty({ type: [BudgetCategoryDto] })
  categories!: BudgetCategoryDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
