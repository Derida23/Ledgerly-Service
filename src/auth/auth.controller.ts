import { All, Controller, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { getAuth } from '../lib/auth';
import { Public } from './decorators/public.decorator';

@ApiExcludeController()
@Controller('api/auth')
export class AuthController {
  @Public()
  @All('*path')
  async handleAuth(@Req() req: Request, @Res() res: Response): Promise<void> {
    const auth = await getAuth();
    const { toNodeHandler } = await import('better-auth/node');
    const handler = toNodeHandler(auth);
    await handler(req, res);
  }
}
