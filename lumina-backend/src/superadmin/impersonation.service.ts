import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { Role } from '@prisma/client';

import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { PrismaService } from '../prisma/prisma.service';
import { AUDIT_ACTIONS } from './audit.constants';
import { AuditService } from './audit.service';

/** TTL corto del token de impersonación (1 hora). */
export const IMPERSONATION_TTL_SECONDS = 3600;

export type ImpersonationTokenPayload = {
  sub: string;
  email: string;
  role: Role;
  /** Marca el token como sesión de soporte. */
  imp: true;
  /** Admin que impersona (`act`or). */
  act: string;
  /** Id de la fila `AdminImpersonationSession` — fuente de verdad de revocación. */
  jti: string;
};

@Injectable()
export class ImpersonationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async start(
    admin: JwtAuthUser,
    targetId: string,
    ctx: { ip?: string | null; userAgent?: string | null },
  ) {
    if (admin.impersonatedBy) {
      throw new ForbiddenException(
        'Ya estás en una sesión de soporte. Sal de ella antes de iniciar otra.',
      );
    }
    if (admin.id === targetId) {
      throw new BadRequestException('No puedes impersonarte a ti mismo.');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        role: true,
        isActive: true,
        deletedAt: true,
      },
    });
    if (!target) throw new NotFoundException('Usuario no encontrado.');
    if (target.role === Role.SUPERADMIN) {
      throw new ForbiddenException('No se puede impersonar una cuenta SUPERADMIN.');
    }
    if (target.deletedAt || !target.isActive) {
      throw new BadRequestException(
        'No se puede impersonar una cuenta inactiva o eliminada.',
      );
    }

    const jti = randomUUID();
    await this.prisma.adminImpersonationSession.create({
      data: {
        jti,
        adminId: admin.id,
        targetUserId: target.id,
        ip: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
      },
    });

    const payload: ImpersonationTokenPayload = {
      sub: target.id,
      email: target.email,
      role: target.role,
      imp: true,
      act: admin.id,
      jti,
    };
    const token = this.jwt.sign(payload, {
      expiresIn: IMPERSONATION_TTL_SECONDS,
    });

    await this.audit.record(admin.id, AUDIT_ACTIONS.IMPERSONATE_START, {
      targetUserId: target.id,
      metadata: { jti },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return {
      token,
      expiresInSeconds: IMPERSONATION_TTL_SECONDS,
      target: {
        id: target.id,
        name: target.name,
        lastName: target.lastName,
        email: target.email,
        role: target.role,
      },
    };
  }

  /** La llama el propio token de impersonación (`user.impersonatedBy` presente). */
  async end(user: JwtAuthUser) {
    if (!user.impersonatedBy || !user.impersonationJti) {
      throw new BadRequestException('No estás en una sesión de soporte.');
    }

    const session = await this.prisma.adminImpersonationSession.findUnique({
      where: { jti: user.impersonationJti },
    });
    if (session && !session.endedAt) {
      await this.prisma.adminImpersonationSession.update({
        where: { jti: user.impersonationJti },
        data: { endedAt: new Date() },
      });
    }

    await this.audit.record(user.impersonatedBy, AUDIT_ACTIONS.IMPERSONATE_END, {
      targetUserId: user.id,
      metadata: { jti: user.impersonationJti },
    });

    return { ended: true };
  }
}
