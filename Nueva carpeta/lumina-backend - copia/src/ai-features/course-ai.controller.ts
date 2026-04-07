import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiFeaturesService } from './ai-features.service';
import { StudentFeedbackDto } from './dto/student-feedback.dto';
import { ClassSummaryDto } from './dto/class-summary.dto';

/**
 * Funcionalidades de IA con contexto de curso.
 * Solo accesibles por personal docente del curso.
 */
@UseGuards(JwtAuthGuard)
@Controller('courses/:courseId/ai')
export class CourseAiController {
  constructor(private readonly aiService: AiFeaturesService) {}

  /**
   * POST /courses/:courseId/ai/student-feedback
   * Genera retroalimentación personalizada basada en el desempeño del estudiante.
   * Body: { studentId, periodId }
   */
  @Post('student-feedback')
  getStudentFeedback(
    @Param('courseId') courseId: string,
    @Body() dto: StudentFeedbackDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.aiService.getStudentFeedback(courseId, dto, user.id, user.role);
  }

  /**
   * POST /courses/:courseId/ai/class-summary
   * Genera un resumen automático del contenido de una clase (slides).
   * Body: { classId }
   */
  @Post('class-summary')
  summarizeClass(
    @Param('courseId') courseId: string,
    @Body() dto: ClassSummaryDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.aiService.summarizeClass(courseId, dto, user.id, user.role);
  }
}
