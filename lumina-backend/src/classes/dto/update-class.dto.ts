import { IsString, IsOptional, MinLength, IsObject, IsIn, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export class UpdateClassDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @Transform(trimIfString)
  title?: string;

  @IsOptional()
  @IsString()
  @Transform(trimIfString)
  description?: string;

  @IsOptional()
  @IsObject()
  desempeno?: Record<string, unknown>;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIn(['DRAFT', 'PUBLISHED', 'LIVE', 'ARCHIVED'])
  status?: 'DRAFT' | 'PUBLISHED' | 'LIVE' | 'ARCHIVED';

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsIn(['clase', 'presentacion', 'autonomo'])
  modoEntrega?: 'clase' | 'presentacion' | 'autonomo';

  @IsOptional()
  @IsString()
  background?: string;

  /** Segundos del temporizador global en vivo. 0 = desactivado. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(600)
  timerGlobal?: number;
}
