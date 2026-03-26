import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PerformanceTrackingService } from './performance-tracking.service';

@UseGuards(JwtAuthGuard)
@Controller('students/:userId/performance')
export class StudentHistoryController {
  constructor(private readonly performanceService: PerformanceTrackingService) {}

  /** GET /students/:userId/performance/history — ADMIN/SUPERADMIN o el propio estudiante */
  @Get('history')
  getCrossCourseHistory(
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.performanceService.getCrossCourseHistory(userId, req.user.userId, req.user.role);
  }
}
