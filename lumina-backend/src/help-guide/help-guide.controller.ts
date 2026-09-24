import { Controller, Get, Post, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { HelpGuideService } from './help-guide.service';

/**
 * "Guía de Lumina" (X.2) — clase de sistema de solo lectura. Solo rol
 * TEACHER (decisión cerrada; STUDENT queda fuera de alcance). Ninguna de
 * estas rutas pasa por `CourseAuthorizationService` porque la clase no
 * tiene curso — es a propósito, ver `HelpGuideService.getGuide`.
 */
@Controller('help/guide')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER')
export class HelpGuideController {
  constructor(private readonly helpGuideService: HelpGuideService) {}

  @Get()
  getGuide(@CurrentUser() user: JwtAuthUser) {
    return this.helpGuideService.getGuide(user.id);
  }

  @Post('duplicate')
  duplicate(@CurrentUser() user: JwtAuthUser) {
    return this.helpGuideService.duplicateToPersonalSpace(user.id);
  }

  @Patch('dismiss')
  dismiss(@CurrentUser() user: JwtAuthUser) {
    return this.helpGuideService.dismiss(user.id);
  }
}
