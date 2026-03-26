import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@UseGuards(JwtAuthGuard)
@Controller('courses/:courseId/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  getCourseSummary(
    @Param('courseId') courseId: string,
    @Request() req: any,
    @Query('periodId') periodId?: string,
  ) {
    return this.analyticsService.getCourseSummary(
      courseId,
      req.user.id,
      req.user.role,
      periodId,
    );
  }

  // Nota: 'students' (literal) debe ir antes de 'students/:userId' (param)
  @Get('students')
  getAllStudentsProgress(
    @Param('courseId') courseId: string,
    @Request() req: any,
    @Query('periodId') periodId?: string,
  ) {
    return this.analyticsService.getAllStudentsProgress(
      courseId,
      req.user.id,
      req.user.role,
      periodId,
    );
  }

  @Get('students/:userId')
  getStudentProgress(
    @Param('courseId') courseId: string,
    @Param('userId') targetUserId: string,
    @Request() req: any,
    @Query('periodId') periodId?: string,
  ) {
    return this.analyticsService.getStudentProgress(
      courseId,
      targetUserId,
      req.user.id,
      req.user.role,
      periodId,
    );
  }

  @Get('activities')
  getActivitiesRanking(
    @Param('courseId') courseId: string,
    @Request() req: any,
    @Query('periodId') periodId?: string,
  ) {
    return this.analyticsService.getActivitiesRanking(
      courseId,
      req.user.id,
      req.user.role,
      periodId,
    );
  }

  @Get('live-sessions')
  getLiveSessionsStats(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    return this.analyticsService.getLiveSessionsStats(
      courseId,
      req.user.id,
      req.user.role,
    );
  }

  @Get('engagement')
  getEngagement(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    return this.analyticsService.getEngagement(
      courseId,
      req.user.id,
      req.user.role,
    );
  }

  @Get('export')
  exportCourse(
    @Param('courseId') courseId: string,
    @Request() req: any,
    @Query('periodId') periodId?: string,
  ) {
    return this.analyticsService.exportCourse(
      courseId,
      req.user.id,
      req.user.role,
      periodId,
    );
  }
}
