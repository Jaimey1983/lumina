import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
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
    @Request() req: any,
    @Query('periodId') periodId?: string,
  ) {
    return this.reportsService.getMatrix(
      courseId,
      req.user.userId,
      req.user.role,
      periodId,
    );
  }

  @Get('final-grades')
  getFinalGrades(
    @Param('courseId') courseId: string,
    @Request() req: any,
    @Query('periodId') periodId?: string,
  ) {
    return this.reportsService.getFinalGrades(
      courseId,
      req.user.userId,
      req.user.role,
      periodId,
    );
  }

  @Get('distribution')
  getDistribution(
    @Param('courseId') courseId: string,
    @Request() req: any,
    @Query('periodId') periodId?: string,
  ) {
    return this.reportsService.getDistribution(
      courseId,
      req.user.userId,
      req.user.role,
      periodId,
    );
  }

  @Get('pending')
  getPending(
    @Param('courseId') courseId: string,
    @Request() req: any,
    @Query('periodId') periodId?: string,
  ) {
    return this.reportsService.getPending(
      courseId,
      req.user.userId,
      req.user.role,
      periodId,
    );
  }

  @Get('export')
  exportReport(
    @Param('courseId') courseId: string,
    @Request() req: any,
    @Query('periodId') periodId?: string,
  ) {
    return this.reportsService.exportReport(
      courseId,
      req.user.userId,
      req.user.role,
      periodId,
    );
  }

  // Ruta con parámetro — después de las literales
  @Get('students/:userId')
  getStudentBreakdown(
    @Param('courseId') courseId: string,
    @Param('userId') targetUserId: string,
    @Request() req: any,
    @Query('periodId') periodId?: string,
  ) {
    return this.reportsService.getStudentBreakdown(
      courseId,
      targetUserId,
      req.user.userId,
      req.user.role,
      periodId,
    );
  }
}
