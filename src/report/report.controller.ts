import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ReportService } from './report.service';
import { DashboardResponseDto, ReportResponseDto } from './dto/report-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Reports')
@ApiCookieAuth()
@Controller('api/reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard: total saldo semua wallet + tren 12 bulan' })
  @ApiResponse({ status: 200, description: 'Dashboard data', type: DashboardResponseDto })
  getDashboard(@CurrentUser() user: { id: string }) {
    return this.reportService.getDashboard(user.id);
  }

  @Get('weekly')
  @ApiOperation({ summary: 'Laporan mingguan (Senin-Minggu)' })
  @ApiQuery({ name: 'date', required: false, description: 'Tanggal dalam minggu (default: minggu ini)' })
  @ApiResponse({ status: 200, description: 'Laporan mingguan', type: ReportResponseDto })
  getWeekly(
    @CurrentUser() user: { id: string },
    @Query('date') date?: string,
  ) {
    return this.reportService.getReport(user.id, 'weekly', date);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Laporan bulanan + perbandingan bulan lalu' })
  @ApiQuery({ name: 'date', required: false, description: 'Tanggal dalam bulan (default: bulan ini)' })
  @ApiResponse({ status: 200, description: 'Laporan bulanan', type: ReportResponseDto })
  getMonthly(
    @CurrentUser() user: { id: string },
    @Query('date') date?: string,
  ) {
    return this.reportService.getReport(user.id, 'monthly', date);
  }

  @Get('yearly')
  @ApiOperation({ summary: 'Laporan tahunan (Januari-Desember)' })
  @ApiQuery({ name: 'date', required: false, description: 'Tanggal dalam tahun (default: tahun ini)' })
  @ApiResponse({ status: 200, description: 'Laporan tahunan', type: ReportResponseDto })
  getYearly(
    @CurrentUser() user: { id: string },
    @Query('date') date?: string,
  ) {
    return this.reportService.getReport(user.id, 'yearly', date);
  }
}
