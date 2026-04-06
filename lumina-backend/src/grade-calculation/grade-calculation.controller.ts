import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { GradeCalculationService } from './grade-calculation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('courses/:courseId')
@UseGuards(JwtAuthGuard)
export class GradeCalculationController {
  constructor(
    private readonly gradeCalculationService: GradeCalculationService,
  ) {}

  // GET /courses/:courseId/grade-calculation?periodId=xxx
  // Resumen compacto de todos los estudiantes — TEACHER/ADMIN/SUPERADMIN
  @Get('grade-calculation')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  getSummary(
    @Param('courseId') courseId: string,
    @Query('periodId') periodId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    if (!periodId?.trim()) {
      throw new BadRequestException(
        'Query periodId es obligatorio (ej. ?periodId=...)',
      );
    }
    return this.gradeCalculationService.getSummary(
      courseId,
      periodId.trim(),
      user.id,
      user.role,
    );
  }

  // GET /courses/:courseId/grade-calculation/full?periodId=xxx
  // Desglose completo de todos los estudiantes — TEACHER/ADMIN/SUPERADMIN
  @Get('grade-calculation/full')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN', 'SUPERADMIN')
  calculateForCourse(
    @Param('courseId') courseId: string,
    @Query('periodId') periodId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    if (!periodId?.trim()) {
      throw new BadRequestException(
        'Query periodId es obligatorio (ej. ?periodId=...)',
      );
    }
    return this.gradeCalculationService.calculateForCourse(
      courseId,
      periodId.trim(),
      user.id,
      user.role,
    );
  }

  // GET /courses/:courseId/grade-calculation/students/:userId?periodId=xxx
  // Desglose individual — TEACHER/ADMIN/SUPERADMIN ven cualquier estudiante
  // STUDENT solo puede ver su propia nota
  @Get('grade-calculation/students/:userId')
  async calculateForStudent(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
    @Query('periodId') periodId: string,
    @CurrentUser() user: JwtAuthUser,
  ) {
    const requester = user;

    const isPrivileged = ['TEACHER', 'ADMIN', 'SUPERADMIN'].includes(
      requester.role,
    );
    const isOwnGrade = requester.id === userId;

    if (!isPrivileged && !isOwnGrade) {
      throw new ForbiddenException('Solo puedes consultar tu propia nota');
    }

    if (!periodId?.trim()) {
      throw new BadRequestException(
        'Query periodId es obligatorio (ej. ?periodId=...)',
      );
    }

    return this.gradeCalculationService.calculateForStudent(
      courseId,
      periodId.trim(),
      userId,
      requester.id,
      requester.role,
    );
  }
}
