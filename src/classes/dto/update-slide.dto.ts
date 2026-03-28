import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';
import { SlideType } from './create-slide.dto';

export class UpdateSlideDto {
  @IsOptional()
  @IsEnum(SlideType)
  type?: SlideType;

  @IsOptional()
  @IsString()
  @Transform(trimIfString)
  title?: string;

  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;
}
