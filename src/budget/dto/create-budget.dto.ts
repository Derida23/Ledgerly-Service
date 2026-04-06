import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateBudgetDto {
  @ApiProperty({ description: 'Nama budget', example: 'Budget Bulanan' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Limit budget per bulan (IDR)', example: 1000000 })
  @IsNumber()
  @Min(1)
  limit!: number;

  @ApiProperty({
    description: 'ID kategori yang masuk budget',
    example: ['clx_kategori_makanan', 'clx_kategori_transport'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  categoryIds!: string[];
}
