import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';
import { SlideType } from './create-slide.dto';

export class UpdateSlideDto {
  @IsOptional()
  @IsEnum(SlideType)
  type?: SlideType;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  title?: string;

  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;
}