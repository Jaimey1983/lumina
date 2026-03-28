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
import { trimIfString } from '../../common/trim-if-string';

export class BulkSlideItem {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @Transform(trimIfString)
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
