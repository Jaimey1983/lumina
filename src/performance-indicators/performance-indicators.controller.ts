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
import { PerformanceIndicatorsService } from './performance-indicators.service';
import { CreateAspectDto } from './dto/create-aspect.dto';
import { UpdateAspectDto } from './dto/update-aspect.dto';
import { CreatePerformanceIndicatorDto } from './dto/create-performance-indicator.dto';
import { UpdatePerformanceIndicatorDto } from './dto/update-performance-indicator.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PerformanceIndicatorsController {
  constructor(
    private readonly performanceIndicatorsService: PerformanceIndicatorsService,
  ) {}

  // ── Gradebook Structure ────────────────────────────────────
  @Post('courses/:courseId/gradebook')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  createStructure(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.performanceIndicatorsService.createStructure(
      courseId,
      user.id,
      user.role,
    );
  }

  @Get('courses/:courseId/gradebook')
  getStructure(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.performanceIndicatorsService.getStructure(
      courseId,
      user.id,
      user.role,
    );
  }

  // ── Aspects ────────────────────────────────────────────────
  @Post('courses/:courseId/gradebook/aspects')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  createAspect(
    @Param('courseId') courseId: string,
    @Body() dto: CreateAspectDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.performanceIndicatorsService.createAspect(
      courseId,
      dto,
      user.id,
      user.role,
    );
  }

  @Patch('courses/:courseId/gradebook/aspects/:aspectId')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  updateAspect(
    @Param('courseId') courseId: string,
    @Param('aspectId') aspectId: string,
    @Body() dto: UpdateAspectDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.performanceIndicatorsService.updateAspect(
      courseId,
      aspectId,
      dto,
      user.id,
      user.role,
    );
  }

  @Delete('courses/:courseId/gradebook/aspects/:aspectId')
  @HttpCode(HttpStatus.OK)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  deleteAspect(
    @Param('courseId') courseId: string,
    @Param('aspectId') aspectId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.performanceIndicatorsService.deleteAspect(
      courseId,
      aspectId,
      user.id,
      user.role,
    );
  }

  // ── Performance Indicators (Indicadores de Logro) ─────────
  @Post('achievements/:achievementId/indicators')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  createPI(
    @Param('achievementId') achievementId: string,
    @Body() dto: CreatePerformanceIndicatorDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.performanceIndicatorsService.createPerformanceIndicator(
      achievementId,
      dto,
      user.id,
      user.role,
    );
  }

  @Patch('achievements/:achievementId/indicators/:indicatorId')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  updatePI(
    @Param('achievementId') achievementId: string,
    @Param('indicatorId') indicatorId: string,
    @Body() dto: UpdatePerformanceIndicatorDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.performanceIndicatorsService.updatePerformanceIndicator(
      achievementId,
      indicatorId,
      dto,
      user.id,
      user.role,
    );
  }

  @Delete('achievements/:achievementId/indicators/:indicatorId')
  @HttpCode(HttpStatus.OK)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  deletePI(
    @Param('achievementId') achievementId: string,
    @Param('indicatorId') indicatorId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.performanceIndicatorsService.deletePerformanceIndicator(
      achievementId,
      indicatorId,
      user.id,
      user.role,
    );
  }
}
