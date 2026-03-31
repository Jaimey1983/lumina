import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export class EvaluateResponseDto {
  @IsString()
  @Transform(trimIfString)
  question: string;

  @IsString()
  @Transform(trimIfString)
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
