import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma, Role, VerificationStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { isTeacherRole } from '../verification/verification.util';
import { AUDIT_ACTIONS } from './audit.constants';
import { AuditService } from './audit.service';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { generateTemporaryPassword } from './temp-password.util';

const USER_LIST_SELECT = {
  id: true,
  name: true,
  lastName: true,
  email: true,
  role: true,
  isActive: true,
  deletedAt: true,
  institution: true,
  createdAt: true,
  verificationStatus: true,
  verificationMethod: true,
  verificationExpiresAt: true,
  institutionalEmail: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class SuperadminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;

    const where: Prisma.UserWhereInput = {};

    if (query.onlyDeleted === 'true') {
      where.deletedAt = { not: null };
    } else if (query.includeDeleted !== 'true') {
      where.deletedAt = null;
    }

    if (query.role) where.role = query.role as Role;
    if (query.verificationStatus === 'NONE') {
      where.verificationStatus = null;
    } else if (query.verificationStatus) {
      where.verificationStatus = query.verificationStatus as VerificationStatus;
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: USER_LIST_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  async getDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_LIST_SELECT,
        rejectionReason: true,
        verifiedAt: true,
        verifiedBy: { select: { id: true, name: true, lastName: true } },
        _count: {
          select: {
            teacherCourses: true,
            classResults: true,
            enrollments: true,
            teacherAiKeys: true,
            studentBadges: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    return user;
  }

  // ─── Acciones de cuenta ───────────────────────────────────────────────────

  private async loadTarget(adminId: string, id: string) {
    if (adminId === id) {
      throw new ForbiddenException(
        'No puedes ejecutar esta acción sobre tu propia cuenta.',
      );
    }
    const target = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, isActive: true, deletedAt: true },
    });
    if (!target) throw new NotFoundException('Usuario no encontrado.');
    if (target.role === Role.SUPERADMIN) {
      throw new ForbiddenException(
        'No se puede operar sobre una cuenta SUPERADMIN.',
      );
    }
    return target;
  }

  async suspend(adminId: string, id: string) {
    await this.loadTarget(adminId, id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: USER_LIST_SELECT,
    });
    await this.audit.record(adminId, AUDIT_ACTIONS.USER_SUSPEND, {
      targetUserId: id,
    });
    return updated;
  }

  async reactivate(adminId: string, id: string) {
    await this.loadTarget(adminId, id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: USER_LIST_SELECT,
    });
    await this.audit.record(adminId, AUDIT_ACTIONS.USER_REACTIVATE, {
      targetUserId: id,
    });
    return updated;
  }

  async softDelete(adminId: string, id: string) {
    const target = await this.loadTarget(adminId, id);
    if (target.deletedAt) {
      throw new BadRequestException('El usuario ya está eliminado.');
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
      select: USER_LIST_SELECT,
    });
    await this.audit.record(adminId, AUDIT_ACTIONS.USER_SOFT_DELETE, {
      targetUserId: id,
    });
    return updated;
  }

  async restore(adminId: string, id: string) {
    const target = await this.loadTarget(adminId, id);
    if (!target.deletedAt) {
      throw new BadRequestException('El usuario no está eliminado.');
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
      select: USER_LIST_SELECT,
    });
    await this.audit.record(adminId, AUDIT_ACTIONS.USER_RESTORE, {
      targetUserId: id,
    });
    return updated;
  }

  async resetPassword(adminId: string, id: string) {
    await this.loadTarget(adminId, id);
    const temporaryPassword = generateTemporaryPassword();
    await this.prisma.user.update({
      where: { id },
      data: { password: await bcrypt.hash(temporaryPassword, 12) },
    });
    await this.audit.record(adminId, AUDIT_ACTIONS.USER_PASSWORD_RESET, {
      targetUserId: id,
    });
    // Se devuelve en claro UNA sola vez — el admin la comunica al docente.
    return { temporaryPassword };
  }

  // ─── Verificación (lado admin) ────────────────────────────────────────────

  async approveVerification(adminId: string, id: string) {
    const target = await this.loadTarget(adminId, id);
    if (!isTeacherRole(target.role)) {
      throw new BadRequestException(
        'La verificación sólo aplica a cuentas docentes.',
      );
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        verificationStatus: VerificationStatus.VERIFIED,
        verificationExpiresAt: null,
        verifiedAt: new Date(),
        verifiedById: adminId,
        rejectionReason: null,
      },
      select: USER_LIST_SELECT,
    });
    await this.audit.record(adminId, AUDIT_ACTIONS.VERIFICATION_APPROVE, {
      targetUserId: id,
    });
    return updated;
  }

  async rejectVerification(adminId: string, id: string, reason: string) {
    const target = await this.loadTarget(adminId, id);
    if (!isTeacherRole(target.role)) {
      throw new BadRequestException(
        'La verificación sólo aplica a cuentas docentes.',
      );
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        verificationStatus: VerificationStatus.REJECTED,
        rejectionReason: reason,
        verifiedById: adminId,
        verifiedAt: new Date(),
      },
      select: USER_LIST_SELECT,
    });
    await this.audit.record(adminId, AUDIT_ACTIONS.VERIFICATION_REJECT, {
      targetUserId: id,
      metadata: { reason },
    });
    return updated;
  }
}
