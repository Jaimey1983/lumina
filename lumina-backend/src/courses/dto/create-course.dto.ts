import {
  IsString,
  IsOptional,
  IsIn,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Espejo de `AreaCurricular`/`GradoEscolar` de `@lumina/types/curriculum` — el
 * backend no depende hoy de ese paquete (J2 lo unifica cuando el dataset
 * curricular se extraiga a un paquete de workspace compartido). Mantener en
 * sync a mano hasta entonces.
 */
export const CURRICULUM_AREAS = [
  'lenguaje',
  'matematicas',
  'ciencias-naturales',
  'ciencias-sociales',
  'ingles',
] as const;

export const CURRICULUM_GRADOS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
] as const;

export class CreateCourseDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => value?.trim())
  description?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  @Transform(({ value }: { value: string }) => value?.trim().toUpperCase())
  code: string;

  @IsString()
  @IsOptional()
  @IsIn(CURRICULUM_AREAS)
  area?: string;

  @IsString()
  @IsOptional()
  @IsIn(CURRICULUM_GRADOS)
  grado?: string;
}
