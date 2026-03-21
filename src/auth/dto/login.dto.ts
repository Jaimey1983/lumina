import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength } from 'class-validator';

const normalizeEmail = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const normalizePassword = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

export class LoginDto {
  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail()
  email: string;

  @Transform(({ value }) => normalizePassword(value))
  @IsString()
  @MaxLength(72)
  password: string;
}
