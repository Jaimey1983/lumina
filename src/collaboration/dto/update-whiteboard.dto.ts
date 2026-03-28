import { IsObject, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export class UpdateWhiteboardDto {
  @IsOptional()
  @IsString()
  @Transform(trimIfString)
  name?: string;

  @IsOptional()
  @IsObject()
  content?: Record<string, any>;
}
