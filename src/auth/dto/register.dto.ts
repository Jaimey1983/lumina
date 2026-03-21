import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';

export enum Role {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD',
  TEACHER = 'TEACHER',
  TEACHER_ASSISTANT = 'TEACHER_ASSISTANT',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  GUEST = 'GUEST',
}

const normalizeRequiredString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const normalizeEmail = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const normalizePassword = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const normalizeRole = (value: unknown): Role | undefined =>
  typeof value === 'string' ? (value.toUpperCase() as Role) : undefined;

export class RegisterDto {
  @Transform(({ value }) => normalizeRequiredString(value))
  @IsString()
  @MaxLength(50)
  name: string;

  @Transform(({ value }) => normalizeRequiredString(value))
  @IsString()
  @MaxLength(50)
  lastName: string;

  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail()
  email: string;

  @Transform(({ value }) => normalizePassword(value))
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @Transform(({ value }) => normalizeRole(value))
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
