import {
  IsString,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export class UpdateActivityDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(trimIfString)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  weight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(100)
  maxScore?: number;
}
