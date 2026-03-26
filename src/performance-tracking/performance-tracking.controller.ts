import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PerformanceTrackingService } from './performance-tracking.service';

@UseGuards(JwtAuthGuard)
@Controller('courses/:courseId/performance')
export class PerformanceTrackingController {
  constructor(private readonly performanceService: PerformanceTrackingService) {}

  // Rutas literales ('ranking', 'at-risk') antes de rutas con param (':userId')

  /** GET /courses/:courseId/performance/ranking — solo staff */
  @Get('ranking')
  getRanking(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    return this.performanceService.getRanking(courseId, req.user.userId, req.user.role);
  }

  /** GET /courses/:courseId/performance/at-risk — solo staff */
  @Get('at-risk')
  getAtRisk(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    return this.performanceService.getAtRisk(courseId, req.user.userId, req.user.role);
  }

  /** GET /courses/:courseId/performance/evolution/:userId */
  @Get('evolution/:userId')
  getEvolution(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.performanceService.getEvolution(courseId, userId, req.user.userId, req.user.role);
  }

  /** GET /courses/:courseId/performance/comparison/:userId */
  @Get('comparison/:userId')
  getComparison(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.performanceService.getComparison(courseId, userId, req.user.userId, req.user.role);
  }

  /** GET /courses/:courseId/performance/breakdown/:userId?periodId= */
  @Get('breakdown/:userId')
  getBreakdown(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
    @Query('periodId') periodId: string | undefined,
    @Request() req: any,
  ) {
    return this.performanceService.getBreakdown(courseId, userId, req.user.userId, req.user.role, periodId);
  }
}
