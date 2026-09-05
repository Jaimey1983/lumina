import type { GlobosActivity } from "lumina-frontend/activities/globos";

/** Estado del elemento Globos = la actividad completa. */
export type GlobosEstado = GlobosActivity;

/** Config de runtime del viewer. `onComplete` se reenvía al legacy. */
export interface GlobosConfig {
  readonly onComplete?: (response: unknown) => void;
}

export const GLOBOS_TIPO = "globos" as const;
