import { IsArray, IsIn, IsObject, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';
import {
  AI_ACTIVITY_TYPES,
  type AiActivityType,
} from './generate-activity.dto';

/** Refinamiento conversacional (J8) — mismo patrón que RefineStructureDto (Pieza 2). */
export class RefineActivityDto {
  @IsString()
  @IsIn(AI_ACTIVITY_TYPES)
  type: AiActivityType;

  /** Actividad Lumina actual (el mismo objeto que `generateActivity` devuelve/el editor persiste). */
  @IsObject()
  currentActivity: Record<string, unknown>;

  /** Instrucción del docente, ej: "agrega dos preguntas más", "hazla más fácil". */
  @IsString()
  @Transform(trimIfString)
  instruction: string;

  @IsArray()
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
}
