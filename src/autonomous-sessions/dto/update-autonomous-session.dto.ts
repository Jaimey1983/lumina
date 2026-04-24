import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, Min, ValidateIf } from 'class-validator';

export class UpdateAutonomousSessionDto {
  /** Solo permitido mientras la tarea está `scheduled` (el servicio lo comprueba). */
  @IsOptional()
  @IsDateString()
  opensAt?: string;

  @IsOptional()
  @IsDateString()
  closesAt?: string;

  @IsOptional()
  @IsBoolean()
  allowBackNav?: boolean;

  @IsOptional()
  @IsIn(['advance', 'lock'])
  timerBehavior?: 'advance' | 'lock';

  /** `-1` = intentos ilimitados; en otro caso entero ≥ 1. */
  @IsOptional()
  @IsInt()
  @ValidateIf((o) => (o as UpdateAutonomousSessionDto).maxAttempts !== -1)
  @Min(1)
  maxAttempts?: number;
}
