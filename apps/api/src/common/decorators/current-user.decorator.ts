import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestWithId } from '../interceptors/request-id.interceptor';

export interface AuthenticatedUser {
  userId: string;
  sessionId: string;
}

/**
 * Extracts the authenticated user object attached by the JWT strategy.
 *
 * Usage:
 *   @Get('me')
 *   getMe(@CurrentUser() user: AuthenticatedUser) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<
      RequestWithId & { user: AuthenticatedUser }
    >();
    return request.user;
  },
);
