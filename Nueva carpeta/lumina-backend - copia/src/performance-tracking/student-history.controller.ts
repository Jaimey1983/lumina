import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PerformanceTrackingService } from './performance-tracking.service';

@UseGuards(JwtAuthGuard)
@Controller('students/:userId/performance')
export class StudentHistoryController {
  constructor(
    private readonly performanceService: PerformanceTrackingService,
  ) {}

  /** GET /students/:userId/performance/history — ADMIN/SUPERADMIN o el propio estudiante */
  @Get('history')
  getCrossCourseHistory(
    @Param('userId') userId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.performanceService.getCrossCourseHistory(
      userId,
      user.id,
      user.role,
    );
  }
}
