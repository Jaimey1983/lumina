import { IsString, MinLength } from 'class-validator';

export class SlideSyncDto {
  @IsString()
  @MinLength(1, { message: 'classId es obligatorio' })
  classId: string;

  @IsString()
  @MinLength(1, { message: 'slideId es obligatorio' })
  slideId: string;
}
