import {
  IsArray,
  IsInt,
  IsString,
  Min,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SlideOrderItem {
  @IsString()
  id: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  order: number;
}

export class ReorderSlidesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SlideOrderItem)
  slides: SlideOrderItem[];
}
