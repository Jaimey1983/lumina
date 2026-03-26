import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class GenerateQuizDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
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
