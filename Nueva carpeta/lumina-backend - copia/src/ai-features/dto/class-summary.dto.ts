import { IsString } from 'class-validator';

export class ClassSummaryDto {
  @IsString()
  classId: string;
}
