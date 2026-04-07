import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export class GenerateQuizDto {
  @IsString()
  @Transform(trimIfString)
  text: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  count?: number;

  @IsOptional()
  @IsString()
  type?: 'MultipleChoice' | 'TrueFalse' | 'FillInTheBlanks';
}
