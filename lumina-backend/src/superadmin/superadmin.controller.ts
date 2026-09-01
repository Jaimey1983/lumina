import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ImpersonationBlockedGuard } from '../auth/impersonation-blocked.guard';
import { CreateInvitationCodeDto } from './dto/create-invitation-code.dto';
import { CreateTrustedDomainDto } from './dto/create-trusted-domain.dto';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';
import { SuperadminService } from './superadmin.service';

@UseGuards(JwtAuthGuard, RolesGuard, ImpersonationBlockedGuard)
@Roles('SUPERADMIN', 'ADMIN')
@Controller('superadmin')
export class SuperadminController {
  constructor(private readonly superadmin: SuperadminService) {}

  // ─── Códigos de invitación ────────────────────────────────────────────────

  @Get('invitation-codes')
  listInvitationCodes() {
    return this.superadmin.listInvitationCodes();
  }

  @Post('invitation-codes')
  createInvitationCode(
    @CurrentUser() admin: JwtAuthUser,
    @Body() dto: CreateInvitationCodeDto,
  ) {
    return this.superadmin.createInvitationCode(admin.id, dto);
  }

  @Post('invitation-codes/:id/revoke')
  revokeInvitationCode(
    @CurrentUser() admin: JwtAuthUser,
    @Param('id') id: string,
  ) {
    return this.superadmin.revokeInvitationCode(admin.id, id);
  }

  // ─── Dominios de confianza ────────────────────────────────────────────────

  @Get('trusted-domains')
  listTrustedDomains() {
    return this.superadmin.listTrustedDomains();
  }

  @Post('trusted-domains')
  createTrustedDomain(
    @CurrentUser() admin: JwtAuthUser,
    @Body() dto: CreateTrustedDomainDto,
  ) {
    return this.superadmin.createTrustedDomain(admin.id, dto);
  }

  @Delete('trusted-domains/:id')
  deleteTrustedDomain(
    @CurrentUser() admin: JwtAuthUser,
    @Param('id') id: string,
  ) {
    return this.superadmin.deleteTrustedDomain(admin.id, id);
  }

  // ─── Auditoría ────────────────────────────────────────────────────────────

  @Get('audit-logs')
  listAuditLogs(@Query() query: ListAuditLogsQueryDto) {
    return this.superadmin.listAuditLogs(query);
  }
}
