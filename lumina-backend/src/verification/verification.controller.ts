import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ImpersonationBlockedGuard } from '../auth/impersonation-blocked.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { InstitutionalEmailDto } from './dto/institutional-email.dto';
import { RedeemCodeDto } from './dto/redeem-code.dto';
import { VerificationService } from './verification.service';

@UseGuards(JwtAuthGuard)
@Controller('verification')
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  /** GET /verification/me — estado de verificación efectivo del usuario actual. */
  @Get('me')
  getMyStatus(@CurrentUser() user: JwtAuthUser) {
    return this.verification.getMyStatus(user);
  }

  /** POST /verification/redeem-code — canjea un código de invitación (gracia de 30 días). */
  @Post('redeem-code')
  @UseGuards(ImpersonationBlockedGuard)
  redeemCode(@CurrentUser() user: JwtAuthUser, @Body() dto: RedeemCodeDto) {
    return this.verification.redeemInvitationCode(user, dto.code);
  }

  /** POST /verification/institutional-email — adjunta correo institucional; auto-verifica si el dominio es de confianza. */
  @Post('institutional-email')
  @UseGuards(ImpersonationBlockedGuard)
  attachEmail(
    @CurrentUser() user: JwtAuthUser,
    @Body() dto: InstitutionalEmailDto,
  ) {
    return this.verification.attachInstitutionalEmail(user, dto.email);
  }
}
