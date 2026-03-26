import { IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignPointsDto {
  @IsString()
  userId: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  points: number;
}
