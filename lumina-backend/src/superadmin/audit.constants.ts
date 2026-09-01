/**
 * Catálogo versionado de acciones de `AdminAuditLog` (corrección #5). Toda acción
 * SUPERADMIN sensible se registra con una de estas claves — nunca strings libres.
 * Ampliar aquí al añadir acciones en PR3/PR4.
 */
export const AUDIT_ACTIONS = {
  // PR2 — verificación / emisión
  INVITATION_CODE_CREATE: 'INVITATION_CODE_CREATE',
  INVITATION_CODE_REVOKE: 'INVITATION_CODE_REVOKE',
  TRUSTED_DOMAIN_CREATE: 'TRUSTED_DOMAIN_CREATE',
  TRUSTED_DOMAIN_DELETE: 'TRUSTED_DOMAIN_DELETE',

  // PR3 — gestión de usuarios
  USER_SUSPEND: 'USER_SUSPEND',
  USER_REACTIVATE: 'USER_REACTIVATE',
  USER_SOFT_DELETE: 'USER_SOFT_DELETE',
  USER_RESTORE: 'USER_RESTORE',
  USER_PASSWORD_RESET: 'USER_PASSWORD_RESET',
  VERIFICATION_APPROVE: 'VERIFICATION_APPROVE',
  VERIFICATION_REJECT: 'VERIFICATION_REJECT',
  // PR3+ (reservado)
  PLAN_OVERRIDE: 'PLAN_OVERRIDE',
  RESEARCH_EXPORT: 'RESEARCH_EXPORT',

  // PR4 — impersonación (reservado)
  IMPERSONATE_START: 'IMPERSONATE_START',
  IMPERSONATE_END: 'IMPERSONATE_END',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
