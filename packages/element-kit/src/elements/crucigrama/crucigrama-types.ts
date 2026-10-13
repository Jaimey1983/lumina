import type { CrucigramaActivity } from "../../activities/crucigrama/index.js";

/** Estado del elemento Crucigrama = la actividad completa. */
export type CrucigramaEstado = CrucigramaActivity;

/** Config de runtime del viewer. */
export interface CrucigramaConfig {
  /** Canal de respuesta unificado (etapa U / DU2). */
  readonly onResponse?: (response: unknown) => void;
}

export const CRUCIGRAMA_TIPO = "crucigrama" as const;
