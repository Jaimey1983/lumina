import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { GamificationService } from './gamification.service';
import { AssignPointsDto } from './dto/assign-points.dto';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';
import { AssignBadgeDto } from './dto/assign-badge.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('courses/:courseId/gamification')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  // ── Puntos ────────────────────────────────────────────────

  /**
   * POST /courses/:courseId/gamification/points
   * Asignar o actualizar puntos de un estudiante (reemplaza el total actual).
   * Solo docente titular / ADMIN / SUPERADMIN.
   */
  @Post('points')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  upsertPoints(
    @Param('courseId') courseId: string,
    @Body() dto: AssignPointsDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.gamificationService.upsertPoints(
      courseId,
      dto,
      user.id,
      user.role,
    );
  }

  /**
   * GET /courses/:courseId/gamification/leaderboard
   * Ranking de estudiantes por puntos. Visible para todos los matriculados.
   */
  @Get('leaderboard')
  getLeaderboard(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.gamificationService.getLeaderboard(
      courseId,
      user.id,
      user.role,
    );
  }

  /**
   * GET /courses/:courseId/gamification/students/:userId/points
   * Puntos de un estudiante. STUDENT solo ve los suyos.
   */
  @Get('students/:userId/points')
  getStudentPoints(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.gamificationService.getStudentPoints(
      courseId,
      userId,
      user.id,
      user.role,
    );
  }

  // ── Badges (insignias) ────────────────────────────────────

  /**
   * POST /courses/:courseId/gamification/badges
   * Crear insignia para el curso.
   */
  @Post('badges')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  createBadge(
    @Param('courseId') courseId: string,
    @Body() dto: CreateBadgeDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.gamificationService.createBadge(
      courseId,
      dto,
      user.id,
      user.role,
    );
  }

  /**
   * GET /courses/:courseId/gamification/badges
   * Listar insignias activas del curso.
   */
  @Get('badges')
  listBadges(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.gamificationService.listBadges(courseId, user.id, user.role);
  }

  /**
   * GET /courses/:courseId/gamification/badges/:badgeId
   * Detalle de una insignia.
   */
  @Get('badges/:badgeId')
  getBadge(
    @Param('courseId') courseId: string,
    @Param('badgeId') badgeId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.gamificationService.getBadge(
      courseId,
      badgeId,
      user.id,
      user.role,
    );
  }

  /**
   * PATCH /courses/:courseId/gamification/badges/:badgeId
   * Actualizar nombre, descripción o icono.
   */
  @Patch('badges/:badgeId')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  updateBadge(
    @Param('courseId') courseId: string,
    @Param('badgeId') badgeId: string,
    @Body() dto: UpdateBadgeDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.gamificationService.updateBadge(
      courseId,
      badgeId,
      dto,
      user.id,
      user.role,
    );
  }

  /**
   * DELETE /courses/:courseId/gamification/badges/:badgeId
   * Soft-delete de insignia (isActive: false).
   */
  @Delete('badges/:badgeId')
  @HttpCode(HttpStatus.OK)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  removeBadge(
    @Param('courseId') courseId: string,
    @Param('badgeId') badgeId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.gamificationService.removeBadge(
      courseId,
      badgeId,
      user.id,
      user.role,
    );
  }

  // ── Asignación de badges ──────────────────────────────────

  /**
   * POST /courses/:courseId/gamification/badges/:badgeId/assign
   * Asignar insignia a un estudiante.
   */
  @Post('badges/:badgeId/assign')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  assignBadge(
    @Param('courseId') courseId: string,
    @Param('badgeId') badgeId: string,
    @Body() dto: AssignBadgeDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.gamificationService.assignBadge(
      courseId,
      badgeId,
      dto,
      user.id,
      user.role,
    );
  }

  /**
   * DELETE /courses/:courseId/gamification/badges/:badgeId/students/:userId
   * Revocar insignia de un estudiante.
   */
  @Delete('badges/:badgeId/students/:userId')
  @HttpCode(HttpStatus.OK)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  revokeBadge(
    @Param('courseId') courseId: string,
    @Param('badgeId') badgeId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.gamificationService.revokeBadge(
      courseId,
      badgeId,
      userId,
      user.id,
      user.role,
    );
  }

  /**
   * GET /courses/:courseId/gamification/students/:userId/badges
   * Insignias ganadas por un estudiante. STUDENT solo ve las suyas.
   */
  @Get('students/:userId/badges')
  getStudentBadges(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.gamificationService.getStudentBadges(
      courseId,
      userId,
      user.id,
      user.role,
    );
  }
}
