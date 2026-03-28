import {
  IsString,
  MinLength,
  MaxLength,
  IsDateString,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export class CreatePeriodDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(trimIfString)
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
