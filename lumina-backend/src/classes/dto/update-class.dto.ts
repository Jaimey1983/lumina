import {
  IsString,
  IsOptional,
  MinLength,
  IsObject,
  IsIn,
  IsInt,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { trimIfString } from '../../common/trim-if-string';
import {
  ContextoClaseDto,
  DbaSeleccionadoDto,
  EbcSeleccionadoDto,
  IndicadoresGeneradosDto,
} from '../../curriculum/dto/update-class-curricular-context.dto';

export class UpdateClassDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @Transform(trimIfString)
  title?: string;

  @IsOptional()
  @IsString()
  @Transform(trimIfString)
  description?: string;

  /**
   * LEGADO (Pieza 1, pre-Etapa J6) — se congela, no se migra. Ver
   * `desempenoId` para el motor curricular único (J6).
   */
  @IsOptional()
  @IsObject()
  desempeno?: Record<string, unknown>;

  /**
   * Motor curricular único (Etapa J / J6.3, Entrada 2) — FK al `Desempeno`
   * de curso elegido. El servicio verifica que pertenezca al mismo curso
   * que la clase antes de persistir.
   */
  @IsOptional()
  @IsString()
  desempenoId?: string;

  /**
   * Trazabilidad curricular (Etapa J / J9) — vínculo opcional al
   * `PerformanceIndicator` de origen del curso/logro.
   */
  @IsOptional()
  @IsString()
  performanceIndicatorId?: string;

  /** Camino curricular EXCLUYENTE (J6, "Decisiones cerradas"): "dba" | "ebc". */
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

  /**
   * Entrada 3 (panel IA del editor, J6.4) — qué indicadores de `indicadores`
   * aborda ESTA clase puntual + temas/subtemas elegidos. La Entrada 4
   * (generador de actividades, J6.5) hereda esto de acá.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => ContextoClaseDto)
  contextoClase?: ContextoClaseDto;

  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIn(['DRAFT', 'PUBLISHED', 'LIVE', 'ARCHIVED'])
  status?: 'DRAFT' | 'PUBLISHED' | 'LIVE' | 'ARCHIVED';

  @IsOptional()
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsIn(['clase', 'presentacion', 'autonomo'])
  modoEntrega?: 'clase' | 'presentacion' | 'autonomo';

  @IsOptional()
  @IsString()
  background?: string;

  /** Segundos del temporizador global en vivo. 0 = desactivado. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(600)
  timerGlobal?: number;
}
