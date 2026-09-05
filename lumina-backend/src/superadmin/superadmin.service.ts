import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AUDIT_ACTIONS } from './audit.constants';
import { AuditService } from './audit.service';
import { CreateInvitationCodeDto } from './dto/create-invitation-code.dto';
import { CreateTrustedDomainDto } from './dto/create-trusted-domain.dto';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';
import { generateInvitationCode } from './invitation-code.util';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class SuperadminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─── Códigos de invitación ────────────────────────────────────────────────

  async listInvitationCodes() {
    return this.prisma.invitationCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, lastName: true } },
        usedBy: {
          select: { id: true, name: true, lastName: true, email: true },
        },
      },
    });
  }

  async createInvitationCode(adminId: string, dto: CreateInvitationCodeDto) {
    // Reintenta si colisiona el `code` (@unique) — probabilidad ínfima.
    let created: { id: string; code: string } | null = null;
    for (let attempt = 0; attempt < 5 && !created; attempt++) {
      const code = generateInvitationCode();
      const exists = await this.prisma.invitationCode.findUnique({
        where: { code },
        select: { id: true },
      });
      if (exists) continue;
      created = await this.prisma.invitationCode.create({
        data: {
          code,
          createdById: adminId,
          targetRole: (dto.targetRole as Role) ?? Role.TEACHER,
          maxUses: dto.maxUses ?? 1,
          note: dto.note,
          expiresAt: dto.expiresInDays
            ? new Date(Date.now() + dto.expiresInDays * DAY_MS)
            : null,
        },
        select: { id: true, code: true },
      });
    }
    if (!created) {
      throw new ConflictException(
        'No se pudo generar un código único, intenta de nuevo.',
      );
    }

    await this.audit.record(adminId, AUDIT_ACTIONS.INVITATION_CODE_CREATE, {
      metadata: { invitationCodeId: created.id, maxUses: dto.maxUses ?? 1 },
    });

    return this.prisma.invitationCode.findUniqueOrThrow({
      where: { id: created.id },
    });
  }

  async revokeInvitationCode(adminId: string, id: string) {
    const code = await this.prisma.invitationCode.findUnique({ where: { id } });
    if (!code) throw new NotFoundException('Código no encontrado.');
    if (code.revokedAt) return code;

    const updated = await this.prisma.invitationCode.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    await this.audit.record(adminId, AUDIT_ACTIONS.INVITATION_CODE_REVOKE, {
      metadata: { invitationCodeId: id },
    });

    return updated;
  }

  // ─── Dominios de confianza ────────────────────────────────────────────────

  async listTrustedDomains() {
    return this.prisma.trustedDomain.findMany({ orderBy: { domain: 'asc' } });
  }

  async createTrustedDomain(adminId: string, dto: CreateTrustedDomainDto) {
    const existing = await this.prisma.trustedDomain.findUnique({
      where: { domain: dto.domain },
    });
    if (existing) {
      throw new ConflictException('Ese dominio ya está registrado.');
    }

    const created = await this.prisma.trustedDomain.create({
      data: { domain: dto.domain, autoVerify: dto.autoVerify ?? true },
    });

    await this.audit.record(adminId, AUDIT_ACTIONS.TRUSTED_DOMAIN_CREATE, {
      metadata: { domain: created.domain, autoVerify: created.autoVerify },
    });

    return created;
  }

  async deleteTrustedDomain(adminId: string, id: string) {
    const domain = await this.prisma.trustedDomain.findUnique({
      where: { id },
    });
    if (!domain) throw new NotFoundException('Dominio no encontrado.');

    await this.prisma.trustedDomain.delete({ where: { id } });
    await this.audit.record(adminId, AUDIT_ACTIONS.TRUSTED_DOMAIN_DELETE, {
      metadata: { domain: domain.domain },
    });

    return { id, deleted: true };
  }

  // ─── Auditoría (visor) ────────────────────────────────────────────────────

  async listAuditLogs(query: ListAuditLogsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;

    const where: Prisma.AdminAuditLogWhereInput = {};
    if (query.action) where.action = query.action;
    if (query.adminId) where.adminId = query.adminId;
    if (query.targetUserId) where.targetUserId = query.targetUserId;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          admin: {
            select: { id: true, name: true, lastName: true, email: true },
          },
          targetUser: {
            select: { id: true, name: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    return {
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }
}
