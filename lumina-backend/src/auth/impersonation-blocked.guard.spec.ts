import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

import { ImpersonationBlockedGuard } from './impersonation-blocked.guard';

function ctx(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('ImpersonationBlockedGuard', () => {
  const guard = new ImpersonationBlockedGuard();

  it('permite sesiones normales (sin impersonatedBy)', () => {
    expect(guard.canActivate(ctx({ id: 'u1', impersonatedBy: null }))).toBe(true);
    expect(guard.canActivate(ctx(undefined))).toBe(true);
  });

  it('bloquea cuando hay una sesión de soporte activa', () => {
    expect(() =>
      guard.canActivate(ctx({ id: 'u1', impersonatedBy: 'admin-1' })),
    ).toThrow(ForbiddenException);
  });
});
