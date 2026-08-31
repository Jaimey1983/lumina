import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

const normalizePassword = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

export class ChangePasswordDto {
  @Transform(({ value }) => normalizePassword(value))
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  currentPassword: string;

  @Transform(({ value }) => normalizePassword(value))
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword: string;
}
