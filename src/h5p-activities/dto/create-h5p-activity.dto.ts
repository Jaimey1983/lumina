import {
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsObject,
} from 'class-validator';
import { Transform } from 'class-transformer';

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
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @IsEnum(H5pType)
  h5pType: H5pType;

  @IsObject()
  params: Record<string, unknown>;
}
