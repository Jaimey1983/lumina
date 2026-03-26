import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class EvaluateResponseDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  question: string;

  @IsString()
  @Transform(({ value }) => value?.trim())
  studentResponse: string;

  @IsOptional()
  @IsString()
  rubric?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxScore?: number;
}
