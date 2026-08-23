import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export class ContentAssistantDto {
  @IsString()
  @Transform(trimIfString)
  topic: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(20)
  slideCount?: number;

  @IsOptional()
  @IsString()
  level?: 'beginner' | 'intermediate' | 'advanced';

  /** Resumen DBA/EBC inyectado desde el frontend (buildCurriculumContext). */
  @IsOptional()
  @IsString()
  @Transform(trimIfString)
  curriculumContext?: string;

  /** Estructura pedagógica de la plantilla seleccionada por el docente.
   *  Ej: "Slide 1: Portada → Slide 2: Caso problema → ..." */
  @IsOptional()
  @IsString()
  @Transform(trimIfString)
  plantillaEstructura?: string;
}
