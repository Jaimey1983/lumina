import { IsString, IsOptional, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class EnrollStudentDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email?: string;
}
