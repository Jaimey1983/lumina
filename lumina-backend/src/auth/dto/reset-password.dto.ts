import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

const normalizeToken = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const normalizePassword = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

export class ResetPasswordDto {
  @Transform(({ value }) => normalizeToken(value))
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  token: string;

  @Transform(({ value }) => normalizePassword(value))
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
