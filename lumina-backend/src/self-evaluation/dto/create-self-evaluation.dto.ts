import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateSelfEvaluationDto {
  @IsString()
  userId: string;

  @IsString()
  periodId: string;

  @IsNumber()
  @Min(0)
  @Max(5)
  score: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
