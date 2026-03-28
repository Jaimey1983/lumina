import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export class UpdateReplyDto {
  @IsString()
  @Transform(trimIfString)
  body: string;
}
