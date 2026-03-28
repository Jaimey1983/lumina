import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export class CreateThreadDto {
  @IsString()
  @Transform(trimIfString)
  title: string;

  @IsString()
  @Transform(trimIfString)
  body: string;
}
