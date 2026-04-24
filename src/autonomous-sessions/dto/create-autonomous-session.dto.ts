import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

export class CreateAutonomousSessionDto {
  @IsDateString()
  opensAt: string;

  @IsDateString()
  closesAt: string;

  @IsOptional()
  @IsBoolean()
  allowBackNav?: boolean;

  /** `-1` = ilimitados; si no es -1, debe ser ≥ 1. */
  @IsOptional()
  @IsInt()
  @ValidateIf((o) => (o as CreateAutonomousSessionDto).maxAttempts !== -1)
  @Min(1)
  maxAttempts?: number;

  @IsOptional()
  @IsIn(['advance', 'lock'])
  timerBehavior?: 'advance' | 'lock';

  @IsOptional()
  @IsBoolean()
  requireManualStart?: boolean;

  @IsOptional()
  @IsString()
  pin?: string;
}
