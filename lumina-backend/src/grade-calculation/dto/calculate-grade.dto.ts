import { IsString } from 'class-validator';

export class CalculateGradeDto {
  @IsString()
  courseId: string;

  @IsString()
  periodId: string;

  @IsString()
  userId: string;
}
