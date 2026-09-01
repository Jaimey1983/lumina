import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AuditService } from './audit.service';
import { ImpersonationController } from './impersonation.controller';
import { ImpersonationService } from './impersonation.service';
import { SuperadminController } from './superadmin.controller';
import { SuperadminService } from './superadmin.service';
import { SuperadminUsersController } from './superadmin-users.controller';
import { SuperadminUsersService } from './superadmin-users.service';

@Module({
  imports: [AuthModule],
  controllers: [
    SuperadminController,
    SuperadminUsersController,
    ImpersonationController,
  ],
  providers: [
    SuperadminService,
    SuperadminUsersService,
    ImpersonationService,
    AuditService,
  ],
  exports: [AuditService],
})
export class SuperadminModule {}
