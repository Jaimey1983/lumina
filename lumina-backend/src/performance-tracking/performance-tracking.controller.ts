import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PerformanceTrackingService } from './performance-tracking.service';

@UseGuards(JwtAuthGuard)
@Controller('courses/:courseId/performance')
export class PerformanceTrackingController {
  constructor(
    private readonly performanceService: PerformanceTrackingService,
  ) {}

  // Rutas literales ('ranking', 'at-risk') antes de rutas con param (':userId')

  /** GET /courses/:courseId/performance/ranking — solo staff */
  @Get('ranking')
  getRanking(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.performanceService.getRanking(courseId, user.id, user.role);
  }

  /** GET /courses/:courseId/performance/at-risk — solo staff */
  @Get('at-risk')
  getAtRisk(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.performanceService.getAtRisk(courseId, user.id, user.role);
  }

  /** GET /courses/:courseId/performance/evolution/:userId */
  @Get('evolution/:userId')
  getEvolution(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.performanceService.getEvolution(
      courseId,
      userId,
      user.id,
      user.role,
    );
  }

  /** GET /courses/:courseId/performance/comparison/:userId */
  @Get('comparison/:userId')
  getComparison(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.performanceService.getComparison(
      courseId,
      userId,
      user.id,
      user.role,
    );
  }

  /** GET /courses/:courseId/performance/breakdown/:userId?periodId= */
  @Get('breakdown/:userId')
  getBreakdown(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
    @Query('periodId') periodId: string | undefined,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.performanceService.getBreakdown(
      courseId,
      userId,
      user.id,
      user.role,
      periodId,
    );
  }
}
