import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { VERIFICATION_REQUIRED_MESSAGE } from './verification.constants';
import { VerificationService } from './verification.service';
import {
  canPublishOrInvite,
  resolveEffectiveStatus,
} from './verification.util';

/**
 * Bloquea publicar clases / iniciar sesión en vivo / abrir sesión autónoma a
 * docentes cuya verificación no está vigente (`PENDING` / `EXPIRED` / `REJECTED`).
 * No aplica a roles no docentes ni a docentes heredados sin estado (`null`).
 *
 * Debe ir DESPUÉS de `JwtAuthGuard` en la lista de `@UseGuards` para que
 * `request.user` ya esté poblado.
 */
@Injectable()
export class TeacherVerifiedGuard implements CanActivate {
  constructor(private readonly verification: VerificationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ user?: JwtAuthUser }>();
    const user = req.user;
    if (!user) return true; // JwtAuthGuard ya habría rechazado; no es cosa de este guard.

    const effective = resolveEffectiveStatus(user);
    if (canPublishOrInvite(user.role, effective)) return true;

    // Persistir el flip perezoso a EXPIRED (best-effort) antes de rechazar.
    await this.verification.persistLazyExpiry(user.id, user);
    throw new ForbiddenException(VERIFICATION_REQUIRED_MESSAGE);
  }
}
