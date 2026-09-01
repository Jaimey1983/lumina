import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VerificationMethod, VerificationStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import {
  canPublishOrInvite,
  invitationGraceExpiry,
  isTeacherRole,
  resolveEffectiveStatus,
  type VerificationSnapshot,
} from './verification.util';

export type VerificationStatusView = {
  applies: boolean;
  status: VerificationStatus | null;
  method: VerificationMethod | null;
  expiresAt: Date | null;
  canPublish: boolean;
};

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) {}

  buildStatusView(user: JwtAuthUser): VerificationStatusView {
    const effective = resolveEffectiveStatus(user);
    return {
      applies: isTeacherRole(user.role),
      status: effective,
      method: user.verificationMethod,
      expiresAt: user.verificationExpiresAt,
      canPublish: canPublishOrInvite(user.role, effective),
    };
  }

  /**
   * Persiste el flip perezoso `VERIFIED (invitation) → EXPIRED` cuando venció la
   * gracia, para que el estado almacenado (y el dashboard futuro) queden al día.
   * No lanza — es un efecto secundario best-effort.
   */
  async persistLazyExpiry(userId: string, snap: VerificationSnapshot): Promise<void> {
    if (
      snap.verificationStatus === VerificationStatus.VERIFIED &&
      resolveEffectiveStatus(snap) === VerificationStatus.EXPIRED
    ) {
      await this.prisma.user
        .update({
          where: { id: userId },
          data: { verificationStatus: VerificationStatus.EXPIRED },
        })
        .catch(() => undefined);
    }
  }

  async getMyStatus(user: JwtAuthUser): Promise<VerificationStatusView> {
    await this.persistLazyExpiry(user.id, user);
    return this.buildStatusView(user);
  }

  async redeemInvitationCode(
    user: JwtAuthUser,
    code: string,
  ): Promise<VerificationStatusView> {
    if (!isTeacherRole(user.role)) {
      throw new BadRequestException(
        'La verificación docente no aplica a este tipo de cuenta.',
      );
    }

    if (
      user.verificationStatus === VerificationStatus.VERIFIED &&
      user.verificationMethod === VerificationMethod.INSTITUTIONAL_EMAIL
    ) {
      // Ya verificado de forma permanente — no hace falta el código.
      return this.buildStatusView(user);
    }

    const invitation = await this.prisma.invitationCode.findUnique({
      where: { code },
    });
    const now = new Date();

    if (!invitation) {
      throw new NotFoundException('Código de invitación no encontrado.');
    }
    if (invitation.revokedAt) {
      throw new ForbiddenException('Este código de invitación fue revocado.');
    }
    if (invitation.expiresAt && invitation.expiresAt.getTime() <= now.getTime()) {
      throw new ForbiddenException('Este código de invitación expiró.');
    }
    if (invitation.usedCount >= invitation.maxUses) {
      throw new ForbiddenException(
        'Este código de invitación ya alcanzó su número máximo de usos.',
      );
    }
    if (invitation.targetRole !== user.role) {
      throw new BadRequestException(
        'Este código no corresponde a tu tipo de cuenta.',
      );
    }

    const expiresAt = invitationGraceExpiry(now);

    await this.prisma.$transaction([
      this.prisma.invitationCode.update({
        where: { id: invitation.id },
        data: {
          usedCount: { increment: 1 },
          usedById: invitation.usedById ?? user.id,
        },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          verificationStatus: VerificationStatus.VERIFIED,
          verificationMethod: VerificationMethod.INVITATION_CODE,
          verificationExpiresAt: expiresAt,
          rejectionReason: null,
        },
      }),
    ]);

    return {
      applies: true,
      status: VerificationStatus.VERIFIED,
      method: VerificationMethod.INVITATION_CODE,
      expiresAt,
      canPublish: true,
    };
  }

  async attachInstitutionalEmail(
    user: JwtAuthUser,
    email: string,
  ): Promise<VerificationStatusView & { domainTrusted: boolean }> {
    if (!isTeacherRole(user.role)) {
      throw new BadRequestException(
        'La verificación docente no aplica a este tipo de cuenta.',
      );
    }

    const domain = email.split('@')[1]?.toLowerCase() ?? '';
    if (!domain) {
      throw new BadRequestException('Correo institucional inválido.');
    }

    const trusted = await this.prisma.trustedDomain.findUnique({
      where: { domain },
    });
    const autoVerify = Boolean(trusted?.autoVerify);
    const now = new Date();

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        institutionalEmail: email,
        ...(autoVerify
          ? {
              verificationStatus: VerificationStatus.VERIFIED,
              verificationMethod: VerificationMethod.INSTITUTIONAL_EMAIL,
              verificationExpiresAt: null,
              verifiedAt: now,
              rejectionReason: null,
            }
          : {}),
      },
      select: {
        role: true,
        verificationStatus: true,
        verificationMethod: true,
        verificationExpiresAt: true,
      },
    });

    const effective = resolveEffectiveStatus(updated);
    return {
      applies: true,
      status: effective,
      method: updated.verificationMethod,
      expiresAt: updated.verificationExpiresAt,
      canPublish: canPublishOrInvite(updated.role, effective),
      domainTrusted: autoVerify,
    };
  }
}
