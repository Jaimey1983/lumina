import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export const TEXT_ASSIST_ACTIONS = [
  'mejorar',
  'acortar',
  'alargar',
  'formal',
  'cercano',
  'simplificar',
  'corregir',
  'bullets',
  'traducir',
] as const;

export type TextAssistAction = (typeof TEXT_ASSIST_ACTIONS)[number];

class TextAssistContextDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trimIfString)
  slideTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trimIfString)
  courseName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Transform(trimIfString)
  nivelEducativo?: string;
}

/**
 * Reescritura asistida por IA de un fragmento de texto seleccionado en el editor.
 * Sin datos de estudiantes: `text` es material del docente y `context` no lleva PII.
 */
export class TextAssistDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  @Transform(trimIfString)
  text: string;

  @IsIn(TEXT_ASSIST_ACTIONS)
  action: TextAssistAction;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Transform(trimIfString)
  targetLang?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TextAssistContextDto)
  context?: TextAssistContextDto;
}
