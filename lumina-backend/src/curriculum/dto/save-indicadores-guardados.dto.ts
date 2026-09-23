import { IsArray, IsString } from 'class-validator';

/**
 * `POST /curriculum/courses/:courseId/desempenos/:desempenoId/indicadores`
 * (seguimiento a J6.3) — persiste un lote de indicadores en el banco
 * reutilizable del `Desempeno` (`IndicadorGuardado`). El servicio deduplica
 * por texto exacto dentro de cada tipo — mandar de más no duplica filas.
 */
export class SaveIndicadoresGuardadosDto {
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
