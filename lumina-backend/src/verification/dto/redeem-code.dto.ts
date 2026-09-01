import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RedeemCodeDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : '',
  )
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  code: string;
}
