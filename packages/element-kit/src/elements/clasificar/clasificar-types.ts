import type { ClasificarActivity } from "../../activities/clasificar/index.js";

/** Estado del elemento Clasificar = la actividad completa. */
export type ClasificarEstado = ClasificarActivity;

/** Config de runtime del viewer. */
export interface ClasificarConfig {
  /** Canal de respuesta unificado (etapa U / DU2). */
  readonly onResponse?: (response: unknown) => void;
}

export const CLASIFICAR_TIPO = "clasificar" as const;
