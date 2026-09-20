import { IsString, IsOptional, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export class CreateClassDto {
  @IsString()
  @MinLength(3)
  @Transform(trimIfString)
  title: string;

  @IsOptional()
  @IsString()
  @Transform(trimIfString)
  description?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  modoEntrega?: string;
}
