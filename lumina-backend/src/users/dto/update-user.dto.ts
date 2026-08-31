import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MaxLength,
} from 'class-validator';
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

  // Data URL de la imagen de perfil (o '' para quitarla). El frontend la recorta
  // y comprime a WebP/JPEG ~256px (≈15–40 KB); este tope solo evita abusos.
  @IsString()
  @IsOptional()
  @MaxLength(700_000)
  avatar?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
