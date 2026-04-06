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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import {
  PaginatedTransactionResponseDto,
  TransactionResponseDto,
} from './dto/transaction-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Transactions')
@ApiCookieAuth()
@Controller('api/transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buat transaksi baru (pemasukan/pengeluaran)' })
  @ApiResponse({ status: 201, description: 'Transaksi berhasil dibuat', type: TransactionResponseDto })
  @ApiResponse({ status: 400, description: 'Validasi gagal (method wajib untuk expense)' })
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionService.create(user.id, dto);
  }

  @Post('transfer')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Buat transfer antar wallet (otomatis 3 record: keluar + masuk + biaya admin)',
  })
  @ApiResponse({ status: 201, description: 'Transfer berhasil dibuat', type: [TransactionResponseDto] })
  @ApiResponse({ status: 400, description: 'Wallet sumber dan tujuan sama' })
  createTransfer(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateTransferDto,
  ) {
    return this.transactionService.createTransfer(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List transaksi (filter, pagination)' })
  @ApiResponse({ status: 200, description: 'Daftar transaksi', type: PaginatedTransactionResponseDto })
  findAll(
    @CurrentUser() user: { id: string },
    @Query() query: QueryTransactionDto,
  ) {
    return this.transactionService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail transaksi' })
  @ApiResponse({ status: 200, description: 'Detail transaksi', type: TransactionResponseDto })
  @ApiResponse({ status: 404, description: 'Transaksi tidak ditemukan' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.transactionService.findOne(id, user.id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Update transaksi (transfer pair otomatis ikut terupdate)',
  })
  @ApiResponse({ status: 200, description: 'Transaksi berhasil diupdate', type: TransactionResponseDto })
  @ApiResponse({ status: 404, description: 'Transaksi tidak ditemukan' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(id, user.id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hapus transaksi (transfer pair otomatis ikut terhapus)',
  })
  @ApiResponse({ status: 200, description: 'Transaksi berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Transaksi tidak ditemukan' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.transactionService.remove(id, user.id);
  }
}
