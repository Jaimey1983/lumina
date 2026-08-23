import { Type } from 'class-transformer';
import {
  Allow,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class StudentResultDto {
  @IsString()
  studentId: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsString()
  slideId: string;

  @IsString()
  activityType: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  score?: number | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxScore?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  slideIndex?: number;

  @IsBoolean()
  @IsOptional()
  correct?: boolean | null;

  @IsOptional()
  historial?: unknown[];

  /** JSON crudo de lo que envió el estudiante — reconstruible con evaluateActivityResponse. */
  @Allow()
  @IsOptional()
  response?: unknown;
}

export class EndSessionDto {
  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentResultDto)
  @IsOptional()
  resultados?: StudentResultDto[];
}

export class GuardarResultadosDto {
  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentResultDto)
  resultados: StudentResultDto[];
}
