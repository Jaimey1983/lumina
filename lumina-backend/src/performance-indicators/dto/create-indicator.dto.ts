import {
  IsString,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export class CreateIndicatorDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(trimIfString)
  name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  weight: number;
}
