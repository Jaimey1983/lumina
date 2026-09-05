import { Transform } from 'class-transformer';
import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const ROLES = [
  'SUPERADMIN',
  'ADMIN',
  'DEPARTMENT_HEAD',
  'TEACHER',
  'TEACHER_ASSISTANT',
  'STUDENT',
  'PARENT',
  'GUEST',
] as const;

const VERIFICATION_STATUSES = [
  'PENDING',
  'VERIFIED',
  'EXPIRED',
  'REJECTED',
  // `NONE` = sin estado (docentes creados antes de la verificación).
  'NONE',
] as const;

export class ListUsersQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsIn(ROLES as unknown as string[])
  role?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsIn(VERIFICATION_STATUSES as unknown as string[])
  verificationStatus?: string;

  /** `"true"` incluye también los usuarios con soft delete. */
  @IsOptional()
  @IsBooleanString()
  includeDeleted?: string;

  /** `"true"` devuelve SÓLO los usuarios con soft delete. */
  @IsOptional()
  @IsBooleanString()
  onlyDeleted?: string;

  @IsOptional()
  @Transform(({ value }) => Number.parseInt(String(value), 10))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number.parseInt(String(value), 10))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
