import { IsObject, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export class CreateNoteDto {
  @IsString()
  @Transform(trimIfString)
  title: string;

  @IsOptional()
  @IsObject()
  content?: Record<string, any>;
}
