import { Body, Controller, Param, Post, Request, UseGuards } from '@nestjs/common';
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
    @Request() req: any,
  ) {
    return this.aiService.getStudentFeedback(courseId, dto, req.user.id, req.user.role);
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
    @Request() req: any,
  ) {
    return this.aiService.summarizeClass(courseId, dto, req.user.id, req.user.role);
  }
}
