import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export enum SlideType {
  COVER = 'COVER',
  CONTENT = 'CONTENT',
  ACTIVITY = 'ACTIVITY',
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
}

export class CreateSlideDto {
  @IsEnum(SlideType)
  type: SlideType;

  @IsString()
  @Transform(trimIfString)
  title: string;

  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;
}
