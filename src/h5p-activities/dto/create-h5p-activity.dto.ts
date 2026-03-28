import {
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsObject,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export enum H5pType {
  Quiz = 'Quiz',
  Flashcards = 'Flashcards',
  DragAndDrop = 'DragAndDrop',
  FillInTheBlanks = 'FillInTheBlanks',
  MultipleChoice = 'MultipleChoice',
}

export class CreateH5pActivityDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(trimIfString)
  title: string;

  @IsEnum(H5pType)
  h5pType: H5pType;

  @IsObject()
  params: Record<string, unknown>;
}
