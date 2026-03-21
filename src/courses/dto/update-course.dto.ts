import { IsString, IsOptional, IsBoolean, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateCourseDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Transform(({ value }: { value: string }) => value?.trim())
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}