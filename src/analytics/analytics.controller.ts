import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@UseGuards(JwtAuthGuard)
@Controller('courses/:courseId/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  getCourseSummary(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
    @Query('periodId') periodId?: string,
  ) {
    return this.analyticsService.getCourseSummary(
      courseId,
      user.id,
      user.role,
      periodId,
    );
  }

  // Nota: 'students' (literal) debe ir antes de 'students/:userId' (param)
  @Get('students')
  getAllStudentsProgress(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
    @Query('periodId') periodId?: string,
  ) {
    return this.analyticsService.getAllStudentsProgress(
      courseId,
      user.id,
      user.role,
      periodId,
    );
  }

  @Get('students/:userId')
  getStudentProgress(
    @Param('courseId') courseId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: JwtAuthUser,
    @Query('periodId') periodId?: string,
  ) {
    return this.analyticsService.getStudentProgress(
      courseId,
      targetUserId,
      user.id,
      user.role,
      periodId,
    );
  }

  @Get('activities')
  getActivitiesRanking(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
    @Query('periodId') periodId?: string,
  ) {
    return this.analyticsService.getActivitiesRanking(
      courseId,
      user.id,
      user.role,
      periodId,
    );
  }

  @Get('live-sessions')
  getLiveSessionsStats(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.analyticsService.getLiveSessionsStats(
      courseId,
      user.id,
      user.role,
    );
  }

  @Get('engagement')
  getEngagement(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.analyticsService.getEngagement(courseId, user.id, user.role);
  }

  @Get('export')
  exportCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
    @Query('periodId') periodId?: string,
  ) {
    return this.analyticsService.exportCourse(
      courseId,
      user.id,
      user.role,
      periodId,
    );
  }
}
