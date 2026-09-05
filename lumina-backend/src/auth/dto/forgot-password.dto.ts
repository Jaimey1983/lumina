import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

const normalizeEmail = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

export class ForgotPasswordDto {
  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail()
  email: string;
}
