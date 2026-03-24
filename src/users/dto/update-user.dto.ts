import { IsString, IsOptional, IsEnum, IsBoolean, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '../../auth/dto/register.dto';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => value?.trim())
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => value?.trim())
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  institution?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}