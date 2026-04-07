import { Controller, Get } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import { type SessionUser } from './auth/types/auth.types';

@ApiTags('Health')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  healthCheck() {
    return { status: 'ok' };
  }

  @Get('api/me')
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get current user profile with role' })
  @ApiResponse({ status: 200, description: 'Current user data including role' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  getProfile(@CurrentUser() user: SessionUser) {
    return { user };
  }
}
