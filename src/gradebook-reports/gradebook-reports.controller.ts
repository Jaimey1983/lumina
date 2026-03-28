import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GradebookReportsService } from './gradebook-reports.service';

@UseGuards(JwtAuthGuard)
@Controller('courses/:courseId/reports')
export class GradebookReportsController {
  constructor(private readonly reportsService: GradebookReportsService) {}

  // Nota: rutas literales ('matrix', 'final-grades', 'distribution', 'pending', 'export')
  // registradas antes de la ruta con param ('students/:userId')

  @Get('matrix')
  getMatrix(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
    @Query('periodId') periodId?: string,
  ) {
    return this.reportsService.getMatrix(
      courseId,
      user.id,
      user.role,
      periodId,
    );
  }

  @Get('final-grades')
  getFinalGrades(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
    @Query('periodId') periodId?: string,
  ) {
    return this.reportsService.getFinalGrades(
      courseId,
      user.id,
      user.role,
      periodId,
    );
  }

  @Get('distribution')
  getDistribution(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
    @Query('periodId') periodId?: string,
  ) {
    return this.reportsService.getDistribution(
      courseId,
      user.id,
      user.role,
      periodId,
    );
  }

  @Get('pending')
  getPending(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
    @Query('periodId') periodId?: string,
  ) {
    return this.reportsService.getPending(
      courseId,
      user.id,
      user.role,
      periodId,
    );
  }

  @Get('export')
  exportReport(
    @Param('courseId') courseId: string,
    @CurrentUser() user: JwtAuthUser,
    @Query('periodId') periodId?: string,
  ) {
    return this.reportsService.exportReport(
      courseId,
      user.id,
      user.role,
      periodId,
    );
  }

  // Ruta con parámetro — después de las literales
  @Get('students/:userId')
  getStudentBreakdown(
    @Param('courseId') courseId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: JwtAuthUser,
    @Query('periodId') periodId?: string,
  ) {
    return this.reportsService.getStudentBreakdown(
      courseId,
      targetUserId,
      user.id,
      user.role,
      periodId,
    );
  }
}
