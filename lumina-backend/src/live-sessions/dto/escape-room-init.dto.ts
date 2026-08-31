import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class EscapeRoomInitDto {
  @IsString()
  @MinLength(1, { message: 'classId es obligatorio' })
  classId: string;

  @IsString()
  @MinLength(1, { message: 'slideId es obligatorio' })
  slideId: string;

  /** Ignorado si se envían `teamNames`. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  teamCount?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  teamNames?: string[];
}
