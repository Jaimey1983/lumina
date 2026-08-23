import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class NotaManualDto {
  @IsString()
  studentId: string;

  @IsString()
  slideId: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsNumber()
  @Min(0)
  @Max(5)
  score: number;
}
