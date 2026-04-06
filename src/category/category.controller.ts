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
  Query,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Categories')
@ApiCookieAuth()
@Controller('api/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buat kategori custom baru' })
  @ApiResponse({ status: 201, description: 'Kategori berhasil dibuat', type: CategoryResponseDto })
  @ApiResponse({ status: 409, description: 'Nama kategori sudah ada' })
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoryService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List semua kategori (filter by type opsional)' })
  @ApiQuery({ name: 'type', required: false, enum: ['INCOME', 'EXPENSE'] })
  @ApiResponse({ status: 200, description: 'Daftar kategori', type: [CategoryResponseDto] })
  findAll(
    @CurrentUser() user: { id: string },
    @Query('type') type?: 'INCOME' | 'EXPENSE',
  ) {
    return this.categoryService.findAll(user.id, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail kategori' })
  @ApiResponse({ status: 200, description: 'Detail kategori', type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Kategori tidak ditemukan' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.categoryService.findOne(id, user.id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update nama atau ikon kategori' })
  @ApiResponse({ status: 200, description: 'Kategori berhasil diupdate', type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Kategori tidak ditemukan' })
  @ApiResponse({ status: 409, description: 'Nama kategori sudah ada' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, user.id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus kategori (gagal jika masih digunakan transaksi)' })
  @ApiResponse({ status: 200, description: 'Kategori berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Kategori tidak ditemukan' })
  @ApiResponse({ status: 409, description: 'Kategori masih digunakan' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.categoryService.remove(id, user.id);
  }

  @Post('seed')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed default kategori untuk user (skip jika sudah ada)' })
  @ApiResponse({ status: 200, description: 'Default kategori berhasil di-seed' })
  async seed(@CurrentUser() user: { id: string }) {
    await this.categoryService.seedDefaults(user.id);
    return { message: 'Default kategori berhasil di-seed' };
  }
}
