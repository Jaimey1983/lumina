import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiStaffGuard } from './ai-staff';
import { AiFeaturesService } from './ai-features.service';
import { StudentFeedbackDto } from './dto/student-feedback.dto';
import { ClassSummaryDto } from './dto/class-summary.dto';

/**
 * Funcionalidades de IA con contexto de curso.
 * Solo accesibles por personal docente del curso.
 *
 * Mismo rate limit que `AiFeaturesController`: cada endpoint es una llamada de
 * generación cara a un proveedor externo.
 */
@UseGuards(JwtAuthGuard, AiStaffGuard, ThrottlerGuard)
@Throttle({ default: { limit: 20, ttl: 60_000 } })
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
