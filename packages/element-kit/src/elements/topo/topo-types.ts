import type { TopoActivity } from "../../activities/topo/index.js";

/** Estado del elemento Topo = la actividad completa. */
export type TopoEstado = TopoActivity;

/** Config de runtime del viewer. */
export interface TopoConfig {
  /** Canal de respuesta unificado (etapa U / DU2). */
  readonly onResponse?: (response: unknown) => void;
}

export const TOPO_TIPO = "topo" as const;
