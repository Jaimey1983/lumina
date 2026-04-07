import {
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';
import { CompetenceType, CompetenceScope } from '@prisma/client';

export class CreatePerformanceIndicatorDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  @Transform(trimIfString)
  statement: string;

  @IsEnum(CompetenceType)
  competenceType: CompetenceType;

  @IsOptional()
  @IsEnum(CompetenceScope)
  competenceScope?: CompetenceScope;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  subject?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  weight: number;
}
