import type { AbrirCajaActivity } from "lumina-frontend/activities/abrir-caja";

/** Estado del elemento AbrirCaja = la actividad completa. */
export type AbrirCajaEstado = AbrirCajaActivity;

/** Config de runtime del viewer. `onComplete` se reenvía al legacy. */
export interface AbrirCajaConfig {
  readonly onComplete?: (response: unknown) => void;
}

export const ABRIR_CAJA_TIPO = "abrir_caja" as const;
