import { Role, VerificationMethod, VerificationStatus } from '@prisma/client';

/** Usuario adjunto a `request` tras `JwtAuthGuard` (coincide con `JwtStrategy.validate`). */
export type JwtAuthUser = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  role: Role;
  isActive: boolean;
  /** Soft delete: si no es `null`, `JwtStrategy` rechaza el token. */
  deletedAt: Date | null;
  /** Verificación docente — sólo relevante para TEACHER / TEACHER_ASSISTANT. `null` = no aplica. */
  verificationStatus: VerificationStatus | null;
  verificationMethod: VerificationMethod | null;
  verificationExpiresAt: Date | null;
  /** Sesión de soporte activa: id del admin que impersona (`null` = sesión normal). */
  impersonatedBy: string | null;
  /** `jti` de la fila `AdminImpersonationSession` cuando es sesión de soporte. */
  impersonationJti: string | null;
};
