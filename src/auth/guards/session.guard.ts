import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getAuth } from '../../lib/auth';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { type AuthenticatedRequest } from '../types/auth.types';

@Injectable()
export class SessionGuard implements CanActivate {
  private readonly logger = new Logger(SessionGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();

    let session: {
      user: Record<string, unknown>;
      session: Record<string, unknown>;
    } | null;
    try {
      const auth = await getAuth();
      const { fromNodeHeaders } = await import('better-auth/node');
      session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });
    } catch (error) {
      this.logger.error('Session retrieval failed', error);
      throw new UnauthorizedException('Session validation failed');
    }

    if (!session) {
      throw new UnauthorizedException();
    }

    if (!('role' in session.user)) {
      this.logger.error('Session user missing role field');
      throw new UnauthorizedException('Invalid session data');
    }

    const authenticatedReq = request as AuthenticatedRequest;
    authenticatedReq.user =
      session.user as unknown as AuthenticatedRequest['user'];
    authenticatedReq.session =
      session.session as unknown as AuthenticatedRequest['session'];

    return true;
  }
}
