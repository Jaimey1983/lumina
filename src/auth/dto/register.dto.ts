import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

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

export class RegisterDto {
  @IsString()
  name: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}