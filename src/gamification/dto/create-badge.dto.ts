import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export class CreateBadgeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(trimIfString)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Transform(trimIfString)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  icon?: string;
}
