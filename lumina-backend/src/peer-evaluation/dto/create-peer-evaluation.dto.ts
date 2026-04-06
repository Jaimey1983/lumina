import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreatePeerEvaluationDto {
  @IsString()
  evaluatorId: string; // quien evalúa

  @IsString()
  evaluatedId: string; // quien es evaluado

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
