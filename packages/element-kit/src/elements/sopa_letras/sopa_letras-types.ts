import type { SopaLetrasActivity } from "../../activities/sopa-letras/index.js";

/** Estado del elemento SopaLetras = la actividad completa. */
export type SopaLetrasEstado = SopaLetrasActivity;

/** Config de runtime del viewer. `onComplete` se reenvía al legacy. */
export interface SopaLetrasConfig {
  readonly onComplete?: (response: unknown) => void;
}

export const SOPA_LETRAS_TIPO = "sopa_letras" as const;
