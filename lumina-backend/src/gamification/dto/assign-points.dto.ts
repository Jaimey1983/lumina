import { IsString, IsInt, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignPointsDto {
  @IsString()
  userId: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  points: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
