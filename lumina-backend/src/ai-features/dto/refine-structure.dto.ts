import { IsArray, IsObject, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';

export class RefineStructureDto {
  /** Estructura actual generada. */
  @IsObject()
  currentStructure: Record<string, unknown>;

  /** Instrucción del docente, ej: "quita el slide 3", "hazlo más simple". */
  @IsString()
  @Transform(trimIfString)
  instruction: string;

  @IsArray()
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
}
