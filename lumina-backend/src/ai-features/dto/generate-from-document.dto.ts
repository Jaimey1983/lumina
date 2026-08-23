import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export class GenerateFromDocumentDto {
  /** Texto extraído del PDF o pegado directamente. */
  @IsString()
  @Transform(trimIfString)
  documentText: string;

  /** Tema opcional para enfocar la generación. */
  @IsOptional()
  @IsString()
  @Transform(trimIfString)
  topic?: string;

  /** Grado (ej: "6", "7"...). */
  @IsOptional()
  @IsString()
  grade?: string;

  /** Asignatura (ej: "Lenguaje", "Matemáticas"). */
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(10)
  slideCount?: number;

  @IsOptional()
  @IsString()
  level?: 'beginner' | 'intermediate' | 'advanced';

  /** Resumen DBA inyectado desde el frontend (buildCurriculumContext). */
  @IsOptional()
  @IsString()
  curriculumContext?: string;
}
