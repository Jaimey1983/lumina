import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CURRICULUM_AREAS, CURRICULUM_GRADOS } from './create-course.dto';

export class UpdateCourseDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => value?.trim())
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  @IsIn(CURRICULUM_AREAS)
  area?: string;

  @IsString()
  @IsOptional()
  @IsIn(CURRICULUM_GRADOS)
  grado?: string;
}
