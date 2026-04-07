import { All, Controller, Get, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { getAuth } from '../lib/auth';
import { Public } from './decorators/public.decorator';

@ApiExcludeController()
@Controller('api/auth')
export class AuthController {
  @Public()
  @Get('login')
  loginPage(@Res() res: Response) {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Ledgerly Login</title>
  <style>
    body { font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
    .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
    h1 { margin: 0 0 8px; font-size: 24px; }
    p { color: #666; margin: 0 0 24px; }
    button { background: #4285f4; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer; display: flex; align-items: center; gap: 8px; margin: 0 auto; }
    button:hover { background: #3367d6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Ledgerly</h1>
    <p>Personal Expense Tracker</p>
    <button onclick="login()">
      <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#fff" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#fff" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/><path fill="#fff" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/><path fill="#fff" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/></svg>
      Login with Google
    </button>
  </div>
  <script>
    async function login() {
      const res = await fetch('/api/auth/sign-in/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google', callbackURL: window.location.origin + '/' }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    }
  </script>
</body>
</html>`;
    res.type('html').send(html);
  }

  @Public()
  @All('*path')
  async handleAuth(@Req() req: Request, @Res() res: Response): Promise<void> {
    const auth = await getAuth();
    const { toNodeHandler } = await import('better-auth/node');
    const handler = toNodeHandler(auth);
    await handler(req, res);
  }
}
