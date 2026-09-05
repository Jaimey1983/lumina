import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { AiStaffGuard } from './ai-staff';
import { AiFeaturesService } from './ai-features.service';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { GenerateActivityDto } from './dto/generate-activity.dto';
import { ContentAssistantDto } from './dto/content-assistant.dto';
import { EvaluateResponseDto } from './dto/evaluate-response.dto';
import { GenerateFromDocumentDto } from './dto/generate-from-document.dto';
import { RefineStructureDto } from './dto/refine-structure.dto';

/**
 * Funcionalidades de IA independientes de contexto de curso.
 * Solo accesibles por personal docente (TEACHER/ADMIN/SUPERADMIN/etc.).
 *
 * Rate limit por debajo del global (10/min): cada endpoint dispara una llamada
 * de generación cara a un proveedor externo. 20/min deja margen para autoría
 * normal y frena bucles o abuso.
 */
@UseGuards(JwtAuthGuard, AiStaffGuard, ThrottlerGuard)
@Throttle({ default: { limit: 20, ttl: 60_000 } })
@Controller('ai')
export class AiFeaturesController {
  constructor(private readonly aiService: AiFeaturesService) {}

  /** POST /ai/quiz — Generar preguntas de quiz a partir de texto o tema */
  @Post('quiz')
  generateQuiz(@Body() dto: GenerateQuizDto, @CurrentUser() user: JwtAuthUser) {
    return this.aiService.generateQuiz(dto, user.id, user.role);
  }

  /** POST /ai/activity — Generar una actividad Lumina tipada (quiz, V/F, blancos, etc.) */
  @Post('activity')
  generateActivity(
    @Body() dto: GenerateActivityDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.aiService.generateActivity(dto, user.id, user.role);
  }

  /** POST /ai/content-assistant — Generar estructura de clase a partir de un tema */
  @Post('content-assistant')
  contentAssistant(
    @Body() dto: ContentAssistantDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.aiService.contentAssistant(dto, user.id, user.role);
  }

  /** POST /ai/evaluate-response — Evaluar y puntuar una respuesta libre de estudiante */
  @Post('evaluate-response')
  evaluateResponse(
    @Body() dto: EvaluateResponseDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.aiService.evaluateResponse(dto, user.id, user.role);
  }

  /** POST /ai/generate-from-document — Generar clase desde texto de documento */
  @Post('generate-from-document')
  generateFromDocument(
    @Body() dto: GenerateFromDocumentDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.aiService.generateFromDocument(dto, user.id, user.role);
  }

  /** POST /ai/refine-structure — Ajuste conversacional de estructura de clase */
  @Post('refine-structure')
  refineStructure(
    @Body() dto: RefineStructureDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.aiService.refineStructure(dto, user.id, user.role);
  }
}
