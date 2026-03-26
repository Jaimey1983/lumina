import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class BulkSlideItem {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;
}

export class BulkUpdateSlidesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkSlideItem)
  slides: BulkSlideItem[];
}
