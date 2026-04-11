import { IsNumber, IsString, Max, Min } from 'class-validator';

export class SaveManualGradeDto {
  @IsString()
  studentId: string;

  @IsString()
  slideId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  nota: number;
}
