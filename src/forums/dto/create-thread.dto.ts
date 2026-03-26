import { IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateThreadDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsString()
  @Transform(({ value }) => value?.trim())
  body: string;
}
