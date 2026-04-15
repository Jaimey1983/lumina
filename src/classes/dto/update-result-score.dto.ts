import { IsNumber, Min, Max } from 'class-validator';

export class UpdateResultScoreDto {
  @IsNumber()
  @Min(0)
  @Max(5)
  score: number;
}
