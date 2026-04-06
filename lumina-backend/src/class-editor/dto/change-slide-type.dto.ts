import { IsEnum } from 'class-validator';
import { SlideType } from '../../classes/dto/create-slide.dto';

export class ChangeSlideTypeDto {
  @IsEnum(SlideType)
  type: SlideType;
}
