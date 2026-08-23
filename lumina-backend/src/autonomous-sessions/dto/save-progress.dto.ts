import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SaveProgressDto {
  @IsString()
  studentId: string;

  @IsString()
  slideId: string;

  @IsOptional()
  response?: unknown;

  @IsInt()
  @Min(1)
  attemptNumber: number;

  @IsString()
  @IsOptional()
  activityType?: string;

  /** Draft intermedio (p. ej. arrastrar_soltar): persistir estado, no puntuar. */
  @IsOptional()
  @IsBoolean()
  draft?: boolean;
}

export class JoinSessionDto {
  @IsString()
  studentName: string;

  @IsOptional()
  @IsString()
  studentId?: string;
}

export class CompleteSessionDto {
  @IsString()
  studentId: string;

  @IsInt()
  @Min(1)
  attemptNumber: number;
}
