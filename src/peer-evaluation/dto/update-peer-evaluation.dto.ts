import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class UpdatePeerEvaluationDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  score?: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
