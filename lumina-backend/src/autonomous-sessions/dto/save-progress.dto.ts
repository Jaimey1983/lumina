import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

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

/** K5: estado del motor de interacción (se valida a mano contra `Class.variables`). */
export class SaveInteractionStateDto {
  @IsString()
  studentId: string;

  @IsInt()
  @Min(1)
  attemptNumber: number;

  @IsObject()
  state: Record<string, unknown>;
}
