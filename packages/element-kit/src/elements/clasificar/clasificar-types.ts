import type { ClasificarActivity } from "lumina-frontend/activities/clasificar";

/** Estado del elemento Clasificar = la actividad completa. */
export type ClasificarEstado = ClasificarActivity;

/** Config de runtime del viewer. `onComplete` se reenvía al legacy. */
export interface ClasificarConfig {
  readonly onComplete?: (response: unknown) => void;
}

export const CLASIFICAR_TIPO = "clasificar" as const;
