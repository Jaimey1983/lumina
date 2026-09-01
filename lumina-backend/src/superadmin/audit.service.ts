import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import type { AuditAction } from './audit.constants';

export type AuditContext = {
  targetUserId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra una acción SUPERADMIN sensible. `ip`/`userAgent` van dentro de
   * `metadata` (especialmente relevantes en impersonación y export).
   */
  async record(
    adminId: string,
    action: AuditAction,
    ctx: AuditContext = {},
  ): Promise<void> {
    const metadata: Record<string, unknown> = {
      ...(ctx.metadata && typeof ctx.metadata === 'object' ? ctx.metadata : {}),
    };
    if (ctx.ip) metadata.ip = ctx.ip;
    if (ctx.userAgent) metadata.userAgent = ctx.userAgent;

    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        targetUserId: ctx.targetUserId ?? null,
        metadata:
          Object.keys(metadata).length > 0
            ? (metadata as Prisma.InputJsonValue)
            : undefined,
      },
    });
  }
}
