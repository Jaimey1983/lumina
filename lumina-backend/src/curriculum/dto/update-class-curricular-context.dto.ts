import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

/**
 * Entrada 2 (Etapa J / J6) — selección DBA, EXCLUYENTE de `EbcSeleccionadoDto`
 * (J6, decisión cerrada: nunca los dos a la vez).
 */
export class DbaSeleccionadoDto {
  @IsInt()
  unidadId: number;

  @IsArray()
  @IsString({ each: true })
  evidenciasElegidas: string[];
}

/**
 * Entrada 2 — selección EBC, EXCLUYENTE de `DbaSeleccionadoDto`. Los
 * subprocesos elegidos acá pueden incluir los que ningún DBA cubre (es el
 * único camino donde aparecen, J6 §"Decisiones cerradas").
 */
export class EbcSeleccionadoDto {
  @IsArray()
  @IsString({ each: true })
  subprocesosElegidos: string[];
}

/**
 * Entrada 2 — indicadores generados a partir del camino elegido. Eje
 * pedagógico nuevo, desconectado a propósito de
 * `PerformanceIndicator.competenceType` (eje de notas de Edu, J4/J5/D3).
 */
export class IndicadoresGeneradosDto {
  @IsArray()
  @IsString({ each: true })
  cognitivo: string[];

  @IsArray()
  @IsString({ each: true })
  procedimental: string[];

  @IsArray()
  @IsString({ each: true })
  actitudinal: string[];
}

/**
 * Entrada 3 (panel IA del editor) — qué indicadores de `Class.indicadores`
 * aborda esta clase + temas/subtemas elegidos. La Entrada 4 (generador de
 * actividades) hereda esto de acá (J6.4/J6.5, no todavía implementado).
 */
export class ContextoClaseDto {
  @IsArray()
  @IsString({ each: true })
  indicadoresAbordados: string[];

  @IsArray()
  @IsString({ each: true })
  temas: string[];

  @IsArray()
  @IsString({ each: true })
  subtemas: string[];
}

/**
 * Payload para persistir el resultado de la Entrada 2 en una `Class` —
 * `desempenoId` + el camino elegido + los indicadores generados. Todos los
 * campos son opcionales porque el flujo se completa en varios pasos del
 * modal fusionado (D4); el servicio (J6.3) exige la combinación correcta
 * (p. ej. `caminoCurricular` presente si hay `dbaSeleccionado`/`ebcSeleccionado`,
 * nunca ambas selecciones a la vez) — no se repite esa regla acá para no
 * atar el DTO a un único orden de llamadas.
 */
export class UpdateClassCurricularContextDto {
  @IsOptional()
  @IsString()
  desempenoId?: string;

  @IsOptional()
  @IsIn(['dba', 'ebc'])
  caminoCurricular?: 'dba' | 'ebc';

  @IsOptional()
  @ValidateNested()
  @Type(() => DbaSeleccionadoDto)
  dbaSeleccionado?: DbaSeleccionadoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EbcSeleccionadoDto)
  ebcSeleccionado?: EbcSeleccionadoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => IndicadoresGeneradosDto)
  indicadores?: IndicadoresGeneradosDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContextoClaseDto)
  contextoClase?: ContextoClaseDto;
}
