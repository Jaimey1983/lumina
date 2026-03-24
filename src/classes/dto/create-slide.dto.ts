import { IsString, IsOptional, IsEnum, IsInt, Min, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

export enum SlideType {
  COVER     = 'COVER',
  CONTENT   = 'CONTENT',
  ACTIVITY  = 'ACTIVITY',
  VIDEO     = 'VIDEO',
  IMAGE     = 'IMAGE',
}

export class CreateSlideDto {
  @IsEnum(SlideType)
  type: SlideType;

  @IsString()
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;
}