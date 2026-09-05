import type { AhorcadoActivity } from "lumina-frontend/activities/ahorcado";

/** Estado del elemento Ahorcado = la actividad completa. */
export type AhorcadoEstado = AhorcadoActivity;

/** Config de runtime del viewer. `onComplete` se reenvía al legacy. */
export interface AhorcadoConfig {
  readonly onComplete?: (response: unknown) => void;
}

export const AHORCADO_TIPO = "ahorcado" as const;
