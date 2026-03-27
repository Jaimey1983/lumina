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
  Request,
} from '@nestjs/common';
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
  createStructure(@Param('courseId') courseId: string, @Request() req) {
    return this.performanceIndicatorsService.createStructure(
      courseId,
      req.user.id,
      req.user.role,
    );
  }

  @Get('courses/:courseId/gradebook')
  getStructure(@Param('courseId') courseId: string, @Request() req) {
    return this.performanceIndicatorsService.getStructure(
      courseId,
      req.user.id,
      req.user.role,
    );
  }

  // ── Aspects ────────────────────────────────────────────────
  @Post('courses/:courseId/gradebook/aspects')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  createAspect(
    @Param('courseId') courseId: string,
    @Body() dto: CreateAspectDto,
    @Request() req,
  ) {
    return this.performanceIndicatorsService.createAspect(
      courseId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @Patch('courses/:courseId/gradebook/aspects/:aspectId')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  updateAspect(
    @Param('courseId') courseId: string,
    @Param('aspectId') aspectId: string,
    @Body() dto: UpdateAspectDto,
    @Request() req,
  ) {
    return this.performanceIndicatorsService.updateAspect(
      courseId,
      aspectId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete('courses/:courseId/gradebook/aspects/:aspectId')
  @HttpCode(HttpStatus.OK)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  deleteAspect(
    @Param('courseId') courseId: string,
    @Param('aspectId') aspectId: string,
    @Request() req,
  ) {
    return this.performanceIndicatorsService.deleteAspect(
      courseId,
      aspectId,
      req.user.id,
      req.user.role,
    );
  }

  // ── Performance Indicators (Indicadores de Logro) ─────────
  @Post('achievements/:achievementId/indicators')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  createPI(
    @Param('achievementId') achievementId: string,
    @Body() dto: CreatePerformanceIndicatorDto,
    @Request() req,
  ) {
    return this.performanceIndicatorsService.createPerformanceIndicator(
      achievementId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @Patch('achievements/:achievementId/indicators/:indicatorId')
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  updatePI(
    @Param('achievementId') achievementId: string,
    @Param('indicatorId') indicatorId: string,
    @Body() dto: UpdatePerformanceIndicatorDto,
    @Request() req,
  ) {
    return this.performanceIndicatorsService.updatePerformanceIndicator(
      achievementId,
      indicatorId,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete('achievements/:achievementId/indicators/:indicatorId')
  @HttpCode(HttpStatus.OK)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  deletePI(
    @Param('achievementId') achievementId: string,
    @Param('indicatorId') indicatorId: string,
    @Request() req,
  ) {
    return this.performanceIndicatorsService.deletePerformanceIndicator(
      achievementId,
      indicatorId,
      req.user.id,
      req.user.role,
    );
  }
}
