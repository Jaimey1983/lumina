import type { SopaLetrasActivity } from "../../activities/sopa-letras/index.js";

/** Estado del elemento SopaLetras = la actividad completa. */
export type SopaLetrasEstado = SopaLetrasActivity;

/** Config de runtime del viewer. */
export interface SopaLetrasConfig {
  /** Canal de respuesta unificado (etapa U / DU2). */
  readonly onResponse?: (response: unknown) => void;
  /** @deprecated Alias transitorio de `onResponse`; lo manda `RenderActivity` hasta U9d. */
  readonly onComplete?: (response: unknown) => void;
}

export const SOPA_LETRAS_TIPO = "sopa_letras" as const;
