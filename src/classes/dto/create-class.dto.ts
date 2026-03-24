import { IsString, IsOptional, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateClassDto {
  @IsString()
  @MinLength(3)
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsString()
  courseId: string;
}