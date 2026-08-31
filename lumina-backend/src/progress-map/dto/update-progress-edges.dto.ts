import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

export class ProgressEdgeDto {
  @IsString()
  fromClassId: string;

  @IsString()
  toClassId: string;
}

export class UpdateProgressEdgesDto {
  /** Si es `null` o se omite `edges`, se vuelve a la secuencia automática. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgressEdgeDto)
  edges?: ProgressEdgeDto[] | null;
}
