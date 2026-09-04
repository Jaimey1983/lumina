import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export const AI_ACTIVITY_TYPES = [
  'quiz_multiple',
  'verdadero_falso',
  'completar_blancos',
  'short_answer',
  'arrastrar_soltar',
  'emparejar',
  'ordenar_pasos',
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
}
