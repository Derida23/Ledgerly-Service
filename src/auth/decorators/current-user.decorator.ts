import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { type AuthenticatedRequest, type SessionUser } from '../types/auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionUser | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
