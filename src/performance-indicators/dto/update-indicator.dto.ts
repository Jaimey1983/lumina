import { IsString, MinLength, MaxLength, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateIndicatorDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  weight?: number;
}
