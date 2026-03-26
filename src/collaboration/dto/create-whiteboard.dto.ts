import { IsObject, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateWhiteboardDto {
  @IsString()
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsOptional()
  @IsObject()
  content?: Record<string, any>;
}
