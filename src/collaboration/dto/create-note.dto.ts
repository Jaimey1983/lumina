import { IsObject, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateNoteDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsOptional()
  @IsObject()
  content?: Record<string, any>;
}
