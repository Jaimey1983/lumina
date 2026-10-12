import type { AbrirCajaActivity } from "../../activities/abrir-caja/index.js";

/** Estado del elemento AbrirCaja = la actividad completa. */
export type AbrirCajaEstado = AbrirCajaActivity;

/** Config de runtime del viewer. */
export interface AbrirCajaConfig {
  /** Canal de respuesta unificado (etapa U / DU2). */
  readonly onResponse?: (response: unknown) => void;
  /** @deprecated Alias transitorio de `onResponse`; lo manda `RenderActivity` hasta U9d. */
  readonly onComplete?: (response: unknown) => void;
}

export const ABRIR_CAJA_TIPO = "abrir_caja" as const;
