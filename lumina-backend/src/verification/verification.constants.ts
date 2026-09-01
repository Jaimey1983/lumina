import { Role } from '@prisma/client';

/** Roles a los que aplica la verificación docente. El resto quedan fuera del mecanismo. */
export const TEACHER_VERIFICATION_ROLES: readonly Role[] = [
  Role.TEACHER,
  Role.TEACHER_ASSISTANT,
];

/** Días de acceso completo tras canjear un código de invitación antes de exigir otra vía. */
export const INVITATION_CODE_GRACE_DAYS = 30;

/** Mensaje 403 cuando un docente no verificado intenta publicar/invitar. */
export const VERIFICATION_REQUIRED_MESSAGE =
  'Tu cuenta docente aún no está verificada. Puedes editar y guardar borradores, ' +
  'pero para publicar clases o invitar estudiantes necesitas completar la verificación ' +
  '(código de invitación o correo institucional).';
