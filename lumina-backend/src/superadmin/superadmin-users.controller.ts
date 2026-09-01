import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { RejectVerificationDto } from './dto/reject-verification.dto';
import { SuperadminUsersService } from './superadmin-users.service';

@UseGuards(JwtAuthGuard, RolesGuard, ImpersonationBlockedGuard)
@Roles('SUPERADMIN', 'ADMIN')
@Controller('superadmin/users')
export class SuperadminUsersController {
  constructor(private readonly users: SuperadminUsersService) {}

  @Get()
  list(@Query() query: ListUsersQueryDto) {
    return this.users.list(query);
  }

  @Get(':id')
  getDetail(@Param('id') id: string) {
    return this.users.getDetail(id);
  }

  @Patch(':id/suspend')
  suspend(@CurrentUser() admin: JwtAuthUser, @Param('id') id: string) {
    return this.users.suspend(admin.id, id);
  }

  @Patch(':id/reactivate')
  reactivate(@CurrentUser() admin: JwtAuthUser, @Param('id') id: string) {
    return this.users.reactivate(admin.id, id);
  }

  @Delete(':id')
  softDelete(@CurrentUser() admin: JwtAuthUser, @Param('id') id: string) {
    return this.users.softDelete(admin.id, id);
  }

  @Post(':id/restore')
  restore(@CurrentUser() admin: JwtAuthUser, @Param('id') id: string) {
    return this.users.restore(admin.id, id);
  }

  @Post(':id/reset-password')
  resetPassword(@CurrentUser() admin: JwtAuthUser, @Param('id') id: string) {
    return this.users.resetPassword(admin.id, id);
  }

  @Post(':id/verify')
  approveVerification(
    @CurrentUser() admin: JwtAuthUser,
    @Param('id') id: string,
  ) {
    return this.users.approveVerification(admin.id, id);
  }

  @Post(':id/reject')
  rejectVerification(
    @CurrentUser() admin: JwtAuthUser,
    @Param('id') id: string,
    @Body() dto: RejectVerificationDto,
  ) {
    return this.users.rejectVerification(admin.id, id, dto.reason);
  }
}
