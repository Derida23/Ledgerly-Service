import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { BudgetResponseDto } from './dto/budget-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Budgets')
@ApiCookieAuth()
@Controller('api/budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buat budget baru dengan kategori terpilih' })
  @ApiResponse({ status: 201, description: 'Budget berhasil dibuat', type: BudgetResponseDto })
  @ApiResponse({ status: 409, description: 'Nama budget sudah ada' })
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateBudgetDto,
  ) {
    return this.budgetService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List semua budget dengan status spending bulan ini' })
  @ApiResponse({ status: 200, description: 'Daftar budget', type: [BudgetResponseDto] })
  findAll(@CurrentUser() user: { id: string }) {
    return this.budgetService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail budget dengan spending bulan ini' })
  @ApiResponse({ status: 200, description: 'Detail budget', type: BudgetResponseDto })
  @ApiResponse({ status: 404, description: 'Budget tidak ditemukan' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.budgetService.findOne(id, user.id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update budget (nama, limit, atau kategori)' })
  @ApiResponse({ status: 200, description: 'Budget berhasil diupdate', type: BudgetResponseDto })
  @ApiResponse({ status: 404, description: 'Budget tidak ditemukan' })
  @ApiResponse({ status: 409, description: 'Nama budget sudah ada' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetService.update(id, user.id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus budget' })
  @ApiResponse({ status: 200, description: 'Budget berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Budget tidak ditemukan' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.budgetService.remove(id, user.id);
  }
}
