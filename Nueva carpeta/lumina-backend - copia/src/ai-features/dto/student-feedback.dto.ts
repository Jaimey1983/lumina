import { IsString } from 'class-validator';

export class StudentFeedbackDto {
  @IsString()
  studentId: string;

  @IsString()
  periodId: string;
}
