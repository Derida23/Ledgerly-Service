import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransactionResponseDto {
  @ApiProperty({ example: 'clx1234567890' })
  id!: string;

  @ApiProperty({ example: 50000 })
  amount!: number;

  @ApiProperty({ enum: ['INCOME', 'EXPENSE', 'TRANSFER_IN', 'TRANSFER_OUT'] })
  type!: string;

  @ApiPropertyOptional({
    enum: ['CASH', 'QRIS', 'TRANSFER', 'DEBIT'],
    nullable: true,
  })
  method!: string | null;

  @ApiProperty({ example: '2024-01-15T00:00:00.000Z' })
  date!: Date;

  @ApiPropertyOptional({ example: 'Makan siang', nullable: true })
  note!: string | null;

  @ApiPropertyOptional({ example: 'clx...', nullable: true })
  transferPairId!: string | null;

  @ApiProperty()
  wallet!: { id: string; name: string };

  @ApiPropertyOptional({ nullable: true })
  category!: { id: string; name: string; icon: string } | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PaginatedTransactionResponseDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  data!: TransactionResponseDto[];

  @ApiProperty({ example: 100 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;
}
