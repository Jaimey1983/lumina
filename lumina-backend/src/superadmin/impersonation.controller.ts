import {
  Controller,
  Headers,
  Ip,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ImpersonationBlockedGuard } from '../auth/impersonation-blocked.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ImpersonationService } from './impersonation.service';

@UseGuards(JwtAuthGuard)
@Controller('superadmin')
export class ImpersonationController {
  constructor(private readonly impersonation: ImpersonationService) {}

  /** Inicia sesión de soporte "Entrar como [usuario]". Sólo admins reales. */
  @Post('users/:id/impersonate')
  @UseGuards(RolesGuard, ImpersonationBlockedGuard)
  @Roles('SUPERADMIN', 'ADMIN')
  start(
    @CurrentUser() admin: JwtAuthUser,
    @Param('id') id: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.impersonation.start(admin, id, { ip, userAgent });
  }

  /**
   * Finaliza la sesión de soporte. La llama el frontend CON el token de
   * impersonación (no requiere rol admin — el propio token prueba la sesión).
   */
  @Post('impersonation/end')
  end(@CurrentUser() user: JwtAuthUser) {
    return this.impersonation.end(user);
  }
}
