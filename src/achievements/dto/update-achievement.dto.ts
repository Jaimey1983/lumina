import { IsString, MinLength, MaxLength, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { AchievementScope } from '@prisma/client';

export class UpdateAchievementDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  statement?: string;

  @IsOptional()
  @IsEnum(AchievementScope)
  scope?: AchievementScope;
}
