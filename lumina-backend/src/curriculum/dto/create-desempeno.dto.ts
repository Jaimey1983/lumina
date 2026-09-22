import { IsIn, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { EBC_COMPONENTES, ICFES_COMPETENCIAS } from '@lumina/curriculum-data';
import type { AreaCurricular } from '@lumina/curriculum-data';
import { trimIfString } from '../../common/trim-if-string';

/**
 * Todos los códigos de componente/competencia son únicos entre sí a nivel
 * global (verificado en `@lumina/curriculum-data`, J6.0) — este `@IsIn` solo
 * atrapa valores basura/typos. La validación estricta de que el código
 * corresponda al ÁREA del curso (`Course.area`) la hace el servicio (J6.2),
 * no el DTO, porque acá no siempre está disponible el área en el mismo
 * payload (viene de la ruta/`Course`, no del body).
 */
const TODOS_LOS_COMPONENTES_EBC = Object.values(EBC_COMPONENTES)
  .flat()
  .map((c) => c.codigo);
const TODAS_LAS_COMPETENCIAS_ICFES = Object.values(ICFES_COMPETENCIAS)
  .flat()
  .map((c) => c.codigo);

export type { AreaCurricular };

/**
 * Payload para generar un `Desempeno` de curso (Etapa J / J6, Entrada 1).
 * `courseId` sale de la ruta, no del body; `area`/`grado` se leen de
 * `Course` en el servicio, no se repiten acá (D4 — no volver a pedir lo que
 * el curso ya tiene).
 */
export class CreateDesempenoDto {
  @IsString()
  @IsIn(TODOS_LOS_COMPONENTES_EBC)
  @Transform(trimIfString)
  componenteEbc: string;

  @IsString()
  @IsIn(TODAS_LAS_COMPETENCIAS_ICFES)
  @Transform(trimIfString)
  competenciaIcfes: string;
}
