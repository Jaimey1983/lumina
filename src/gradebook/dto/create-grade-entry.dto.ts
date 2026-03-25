import { IsString, IsNumber, Min, IsOptional, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGradeEntryDto {
  @IsString()
  userId: string;

  @IsString()
  activityId: string;

  @IsString()
  periodId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  score: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feedback?: string;
}
