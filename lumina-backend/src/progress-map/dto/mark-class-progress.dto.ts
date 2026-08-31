import { IsBoolean } from 'class-validator';

export class MarkClassProgressDto {
  @IsBoolean()
  completed: boolean;
}
