import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtAuthUser } from './jwt-auth-user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtAuthUser => {
    const req = ctx.switchToHttp().getRequest<{ user: JwtAuthUser }>();
    return req.user;
  },
);
