import type { TopoActivity } from "lumina-frontend/activities/topo";

/** Estado del elemento Topo = la actividad completa. */
export type TopoEstado = TopoActivity;

/** Config de runtime del viewer. `onComplete` se reenvía al legacy. */
export interface TopoConfig {
  readonly onComplete?: (response: unknown) => void;
}

export const TOPO_TIPO = "topo" as const;
