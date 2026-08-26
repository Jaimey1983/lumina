import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AiProvider } from '@prisma/client';
import { trimIfString } from '../../common/trim-if-string';

export class SaveAiKeyDto {
  @IsString()
  @Transform(trimIfString)
  @MinLength(8, { message: 'La clave es demasiado corta' })
  @MaxLength(1024, { message: 'La clave es demasiado larga' })
  apiKey: string;
}

export class TestAiKeyDto {
  /** Si se envía, se prueba esta clave sin guardarla. Si no, se prueba la almacenada. */
  @IsOptional()
  @IsString()
  @Transform(trimIfString)
  @MinLength(8)
  @MaxLength(1024)
  apiKey?: string;
}

export class UpdateAiPreferenceDto {
  @IsEnum(AiProvider)
  preferredProvider: AiProvider;
}
