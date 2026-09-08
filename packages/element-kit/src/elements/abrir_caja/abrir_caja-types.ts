import type { AbrirCajaActivity } from "../../activities/abrir-caja/index.js";

/** Estado del elemento AbrirCaja = la actividad completa. */
export type AbrirCajaEstado = AbrirCajaActivity;

/** Config de runtime del viewer. `onComplete` se reenvía al legacy. */
export interface AbrirCajaConfig {
  readonly onComplete?: (response: unknown) => void;
}

export const ABRIR_CAJA_TIPO = "abrir_caja" as const;
