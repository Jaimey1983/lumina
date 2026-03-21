import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCourseDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => value?.trim())
  description?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  @Transform(({ value }: { value: string }) => value?.trim().toUpperCase())
  code: string;
}