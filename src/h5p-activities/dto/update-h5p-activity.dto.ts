import {
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsObject,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { H5pType } from './create-h5p-activity.dto';

export class UpdateH5pActivityDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @IsOptional()
  @IsEnum(H5pType)
  h5pType?: H5pType;

  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;
}
