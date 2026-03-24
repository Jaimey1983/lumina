import { IsString, MinLength, MaxLength, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateAspectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  weight: number;
}
