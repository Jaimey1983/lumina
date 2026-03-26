import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateReplyDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  body: string;
}
