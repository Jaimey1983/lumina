import { IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export class UpdateForumDto {
  @IsOptional()
  @IsString()
  @Transform(trimIfString)
  name?: string;

  @IsOptional()
  @IsString()
  @Transform(trimIfString)
  description?: string;
}
