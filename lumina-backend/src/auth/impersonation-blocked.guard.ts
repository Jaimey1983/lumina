import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import type { JwtAuthUser } from './jwt-auth-user';

/**
 * Prohíbe acciones sensibles mientras se impersona (sesión de soporte):
 * cambiar contraseña, otorgar/rechazar verificación en nombre del usuario,
 * pagos, y cualquier ruta SUPERADMIN. Va después de `JwtAuthGuard`.
 */
@Injectable()
export class ImpersonationBlockedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: JwtAuthUser }>();
    if (req.user?.impersonatedBy) {
      throw new ForbiddenException(
        'Acción no permitida durante una sesión de soporte. Sal de la sesión para continuar.',
      );
    }
    return true;
  }
}
