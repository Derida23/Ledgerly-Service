import { All, Controller, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { auth } from '../lib/auth';
import { Public } from './decorators/public.decorator';
import { toNodeHandler } from 'better-auth/node';

@ApiExcludeController()
@Controller('api/auth')
export class AuthController {
  private handler = toNodeHandler(auth);

  @Public()
  @All('*path')
  async handleAuth(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.handler(req, res);
  }
}
