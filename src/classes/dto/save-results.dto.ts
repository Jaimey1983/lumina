import { Type } from 'class-transformer';
import {
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

  @IsBoolean()
  @IsOptional()
  correct?: boolean | null;

  @IsOptional()
  historial?: unknown[];
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
