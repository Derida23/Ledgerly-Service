import { ApiProperty } from '@nestjs/swagger';

export class WalletResponseDto {
  @ApiProperty({ example: 'clx1234567890' })
  id!: string;

  @ApiProperty({ example: 'Bank Mandiri' })
  name!: string;

  @ApiProperty({ example: 5000000, description: 'Saldo awal (IDR)' })
  initialBalance!: number;

  @ApiProperty({
    example: 4500000,
    description: 'Saldo saat ini = saldo awal + pemasukan + transfer masuk - pengeluaran - transfer keluar',
  })
  balance!: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}
