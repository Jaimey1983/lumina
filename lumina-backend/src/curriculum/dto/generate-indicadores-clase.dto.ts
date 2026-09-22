import { IsIn, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  DbaSeleccionadoDto,
  EbcSeleccionadoDto,
} from './update-class-curricular-context.dto';

/**
 * Entrada 2 (Etapa J / J6.3) — genera los indicadores cognitivo/procedimental/
 * actitudinal de una clase a partir del camino curricular elegido. DBA y EBC
 * son EXCLUYENTES (J6, "Decisiones cerradas") — el servicio valida que solo
 * venga la selección correspondiente a `caminoCurricular`, no ambas.
 */
export class GenerateIndicadoresClaseDto {
  @IsIn(['dba', 'ebc'])
  caminoCurricular: 'dba' | 'ebc';

  @IsOptional()
  @ValidateNested()
  @Type(() => DbaSeleccionadoDto)
  dbaSeleccionado?: DbaSeleccionadoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EbcSeleccionadoDto)
  ebcSeleccionado?: EbcSeleccionadoDto;
}
