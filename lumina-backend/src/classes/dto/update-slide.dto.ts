import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsInt,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
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

  /**
   * Optimistic locking: si se envía, el update solo aplica cuando
   * `Slide.contentVersion === expectedVersion`. Si no coincide → 409.
   * Clientes legacy que no lo mandan siguen en last-write-wins (compat).
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expectedVersion?: number;
}
