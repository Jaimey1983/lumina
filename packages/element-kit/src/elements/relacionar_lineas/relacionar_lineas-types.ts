import type { RelacionarLineasActivity } from "../../activities/relacionar-lineas/index.js";

/** Estado del elemento = la actividad completa. */
export type RelacionarLineasEstado = RelacionarLineasActivity;

/** Config de runtime del viewer. */
export interface RelacionarLineasConfig {
  /** Canal de respuesta unificado (etapa U / DU2). */
  readonly onResponse?: (response: unknown) => void;
}

export const RELACIONAR_LINEAS_TIPO = "relacionar_lineas" as const;
