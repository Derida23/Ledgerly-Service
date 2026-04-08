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
import { RecurringService } from './recurring.service';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';
import { RecurringResponseDto } from './dto/recurring-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Recurring')
@ApiCookieAuth()
@Controller('api/recurrings')
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buat reminder recurring baru' })
  @ApiResponse({
    status: 201,
    description: 'Recurring berhasil dibuat',
    type: RecurringResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validasi gagal' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateRecurringDto) {
    return this.recurringService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List semua recurring reminder' })
  @ApiResponse({
    status: 200,
    description: 'Daftar recurring',
    type: [RecurringResponseDto],
  })
  findAll(@CurrentUser() user: { id: string }) {
    return this.recurringService.findAll(user.id);
  }

  @Get('due-today')
  @ApiOperation({ summary: 'List recurring yang jatuh tempo hari ini' })
  @ApiResponse({
    status: 200,
    description: 'Recurring jatuh tempo hari ini',
    type: [RecurringResponseDto],
  })
  findDueToday(@CurrentUser() user: { id: string }) {
    return this.recurringService.findDueToday(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail recurring' })
  @ApiResponse({
    status: 200,
    description: 'Detail recurring',
    type: RecurringResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Recurring tidak ditemukan' })
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.recurringService.findOne(id, user.id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update recurring' })
  @ApiResponse({
    status: 200,
    description: 'Recurring berhasil diupdate',
    type: RecurringResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Recurring tidak ditemukan' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateRecurringDto,
  ) {
    return this.recurringService.update(id, user.id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus recurring' })
  @ApiResponse({ status: 200, description: 'Recurring berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Recurring tidak ditemukan' })
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.recurringService.remove(id, user.id);
  }

  @Post('seed')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Seed 6 default recurring reminders (skip jika sudah ada)',
  })
  @ApiResponse({
    status: 200,
    description: 'Default recurring berhasil di-seed',
  })
  async seed(@CurrentUser() user: { id: string }) {
    await this.recurringService.seedDefaults(user.id);
    return { message: 'Default recurring berhasil di-seed' };
  }
}
