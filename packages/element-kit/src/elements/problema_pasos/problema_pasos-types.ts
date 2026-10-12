import type { ProblemaPasosActivity } from "../../activities/problema-pasos/index.js";

/** Estado del elemento = la actividad completa. */
export type ProblemaPasosEstado = ProblemaPasosActivity;

/** Config de runtime del viewer. */
export interface ProblemaPasosConfig {
  /** Canal de respuesta unificado (etapa U / DU2). */
  readonly onResponse?: (response: unknown) => void;
}

export const PROBLEMA_PASOS_TIPO = "problema_pasos" as const;
