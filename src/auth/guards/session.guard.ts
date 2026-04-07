import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getAuth } from '../../lib/auth';
import { PrismaService } from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { type AuthenticatedRequest } from '../types/auth.types';

@Injectable()
export class SessionGuard implements CanActivate {
  private readonly logger = new Logger(SessionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

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

    // Better Auth doesn't return custom fields (role) in session
    // Fetch role from database
    const dbUser = await this.prisma.db.user.findUnique({
      where: { id: session.user.id as string },
      select: { role: true },
    });

    if (!dbUser) {
      throw new UnauthorizedException('User not found');
    }

    const authenticatedReq = request as AuthenticatedRequest;
    authenticatedReq.user = {
      ...(session.user as unknown as AuthenticatedRequest['user']),
      role: dbUser.role,
    };
    authenticatedReq.session =
      session.session as unknown as AuthenticatedRequest['session'];

    return true;
  }
}
