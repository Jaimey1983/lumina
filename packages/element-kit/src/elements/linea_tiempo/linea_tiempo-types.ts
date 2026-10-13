import type { LineaTiempoActivity } from "../../activities/linea-tiempo/index.js";

/** Estado del elemento = la actividad completa. */
export type LineaTiempoEstado = LineaTiempoActivity;

/** Config de runtime del viewer. */
export interface LineaTiempoConfig {
  /** Canal de respuesta unificado (etapa U / DU2). */
  readonly onResponse?: (response: unknown) => void;
}

export const LINEA_TIEMPO_TIPO = "linea_tiempo" as const;
