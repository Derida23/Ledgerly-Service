import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecurringResponseDto {
  @ApiProperty({ example: 'clx...' })
  id!: string;

  @ApiProperty({ example: 'Listrik' })
  name!: string;

  @ApiProperty({ enum: ['EXPENSE', 'TRANSFER'] })
  type!: string;

  @ApiProperty({ example: 500000 })
  amount!: number;

  @ApiProperty({ example: 5 })
  dayOfMonth!: number;

  @ApiProperty()
  wallet!: { id: string; name: string };

  @ApiPropertyOptional({ nullable: true })
  targetWallet!: { id: string; name: string } | null;

  @ApiPropertyOptional({ nullable: true })
  category!: { id: string; name: string; icon: string } | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
