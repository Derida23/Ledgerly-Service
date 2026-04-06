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
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { WalletResponseDto } from './dto/wallet-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Wallets')
@ApiCookieAuth()
@Controller('api/wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buat wallet baru' })
  @ApiResponse({ status: 201, description: 'Wallet berhasil dibuat', type: WalletResponseDto })
  @ApiResponse({ status: 409, description: 'Nama wallet sudah ada' })
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateWalletDto,
  ) {
    return this.walletService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List semua wallet dengan saldo' })
  @ApiResponse({ status: 200, description: 'Daftar wallet', type: [WalletResponseDto] })
  findAll(@CurrentUser() user: { id: string }) {
    return this.walletService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail wallet dengan saldo' })
  @ApiResponse({ status: 200, description: 'Detail wallet', type: WalletResponseDto })
  @ApiResponse({ status: 404, description: 'Wallet tidak ditemukan' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.walletService.findOne(id, user.id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update nama atau saldo awal wallet' })
  @ApiResponse({ status: 200, description: 'Wallet berhasil diupdate', type: WalletResponseDto })
  @ApiResponse({ status: 404, description: 'Wallet tidak ditemukan' })
  @ApiResponse({ status: 409, description: 'Nama wallet sudah ada' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateWalletDto,
  ) {
    return this.walletService.update(id, user.id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus wallet (gagal jika masih ada transaksi)' })
  @ApiResponse({ status: 200, description: 'Wallet berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Wallet tidak ditemukan' })
  @ApiResponse({ status: 409, description: 'Wallet masih memiliki transaksi' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.walletService.remove(id, user.id);
  }

  @Post('seed')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed 7 default wallets (skip jika sudah ada)' })
  @ApiResponse({ status: 200, description: 'Default wallets berhasil di-seed' })
  async seed(@CurrentUser() user: { id: string }) {
    await this.walletService.seedDefaults(user.id);
    return { message: 'Default wallets berhasil di-seed' };
  }
}
