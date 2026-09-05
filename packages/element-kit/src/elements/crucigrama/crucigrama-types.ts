import type { CrucigramaActivity } from "lumina-frontend/activities/crucigrama";

/** Estado del elemento Crucigrama = la actividad completa. */
export type CrucigramaEstado = CrucigramaActivity;

/** Config de runtime del viewer. `onComplete` se reenvía al legacy. */
export interface CrucigramaConfig {
  readonly onComplete?: (response: unknown) => void;
}

export const CRUCIGRAMA_TIPO = "crucigrama" as const;
