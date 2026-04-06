import { IsOptional, IsString, IsEnum } from 'class-validator';
import { AchievementScope } from '@prisma/client';

export class QueryAchievementDto {
  @IsOptional()
  @IsString()
  aspectId?: string;

  @IsOptional()
  @IsString()
  periodId?: string;

  @IsOptional()
  @IsEnum(AchievementScope)
  scope?: AchievementScope;
}
