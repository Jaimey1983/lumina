import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

export const AI_STAFF_ROLES = [
  'ADMIN',
  'SUPERADMIN',
  'TEACHER',
  'TEACHER_ASSISTANT',
  'DEPARTMENT_HEAD',
] as const;

export function assertAiStaff(role: string) {
  if (!(AI_STAFF_ROLES as readonly string[]).includes(role)) {
    throw new ForbiddenException(
      'Solo el personal docente puede usar las funciones de IA',
    );
  }
}

@Injectable()
export class AiStaffGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<{ user?: { role?: string } }>();
    assertAiStaff(req.user?.role ?? '');
    return true;
  }
}
