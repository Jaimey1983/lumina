import {
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';
import { AchievementScope } from '@prisma/client';

export class CreateAchievementDto {
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @Transform(trimIfString)
  code: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  @Transform(trimIfString)
  statement: string;

  @IsString()
  aspectId: string;

  @IsString()
  periodId: string;

  @IsOptional()
  @IsEnum(AchievementScope)
  scope?: AchievementScope;
}
