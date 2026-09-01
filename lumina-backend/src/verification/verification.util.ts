import { Role, VerificationMethod, VerificationStatus } from '@prisma/client';

import {
  INVITATION_CODE_GRACE_DAYS,
  TEACHER_VERIFICATION_ROLES,
} from './verification.constants';

const DAY_MS = 24 * 60 * 60 * 1000;

export function isTeacherRole(role: Role): boolean {
  return TEACHER_VERIFICATION_ROLES.includes(role);
}

export type VerificationSnapshot = {
  verificationStatus: VerificationStatus | null;
  verificationMethod: VerificationMethod | null;
  verificationExpiresAt: Date | null;
};

/**
 * Estado de verificación efectivo (check perezoso de expiración — corrección #4).
 *
 * Un `VERIFIED` cuyo método fue `INVITATION_CODE` y cuya ventana de gracia ya
 * pasó cuenta como `EXPIRED` sin necesidad de un cron. `INSTITUTIONAL_EMAIL` no
 * expira (`verificationExpiresAt` es `null`).
 *
 * Devuelve el estado almacenado tal cual en cualquier otro caso (incluido `null`
 * para docentes creados antes de la migración — se tratan como no-restringidos,
 * ver `canPublishOrInvite`).
 */
export function resolveEffectiveStatus(
  snap: VerificationSnapshot,
  now: Date = new Date(),
): VerificationStatus | null {
  if (
    snap.verificationStatus === VerificationStatus.VERIFIED &&
    snap.verificationMethod === VerificationMethod.INVITATION_CODE &&
    snap.verificationExpiresAt !== null &&
    snap.verificationExpiresAt.getTime() <= now.getTime()
  ) {
    return VerificationStatus.EXPIRED;
  }
  return snap.verificationStatus;
}

/**
 * ¿Puede este usuario publicar clases / invitar estudiantes?
 *
 * - No es rol docente (STUDENT, ADMIN, SUPERADMIN, …) → sí (el guard no aplica).
 * - Rol docente con estado efectivo `VERIFIED` → sí.
 * - Rol docente con estado efectivo `null` → sí (docente heredado de antes de la
 *   verificación; no se le rompe el acceso retroactivamente).
 * - Rol docente `PENDING` / `EXPIRED` / `REJECTED` → no.
 */
export function canPublishOrInvite(
  role: Role,
  effectiveStatus: VerificationStatus | null,
): boolean {
  if (!isTeacherRole(role)) return true;
  return (
    effectiveStatus === null || effectiveStatus === VerificationStatus.VERIFIED
  );
}

/** Fin de la ventana de gracia del código de invitación desde un instante dado. */
export function invitationGraceExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + INVITATION_CODE_GRACE_DAYS * DAY_MS);
}
