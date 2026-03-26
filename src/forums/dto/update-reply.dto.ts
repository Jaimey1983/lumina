import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateReplyDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  body: string;
}
