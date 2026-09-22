import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export const AI_ACTIVITY_TYPES = [
  // Clásicas
  'quiz_multiple',
  'verdadero_falso',
  'completar_blancos',
  'short_answer',
  'arrastrar_soltar',
  'emparejar',
  'ordenar_pasos',
  'video_interactivo',
  'encuesta_viva',
  'nube_palabras',
  // Grupo 4 (J8 — catálogo completo, 2026-09-22)
  'anagrama',
  'clasificar',
  'memoria',
  'puzzle_imagen',
  'sopa_letras',
  'crucigrama',
  'abrir_caja',
  'ahorcado',
  'puzzle_palabras',
  'globos',
  'topo',
  'historia_ramificada',
] as const;

export type AiActivityType = (typeof AI_ACTIVITY_TYPES)[number];

export class GenerateActivityDto {
  @IsString()
  @Transform(trimIfString)
  text: string;

  @IsString()
  @IsIn(AI_ACTIVITY_TYPES)
  type: AiActivityType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  count?: number;

  /**
   * Desempeño + indicadores abordados + temas/subtemas de la Entrada 3
   * (J6.4), inyectado desde el frontend (buildCurricularContextTexto).
   * Mismo patrón que `ContentAssistantDto.curriculumContext`.
   */
  @IsOptional()
  @IsString()
  @Transform(trimIfString)
  curriculumContext?: string;
}
