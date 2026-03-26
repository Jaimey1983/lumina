import { IsObject, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateWhiteboardDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsOptional()
  @IsObject()
  content?: Record<string, any>;
}
