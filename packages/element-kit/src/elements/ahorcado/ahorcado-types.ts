import type { AhorcadoActivity } from "../../activities/ahorcado/index.js";

/** Estado del elemento Ahorcado = la actividad completa. */
export type AhorcadoEstado = AhorcadoActivity;

/** Config de runtime del viewer. */
export interface AhorcadoConfig {
  /** Canal de respuesta unificado (etapa U / DU2). */
  readonly onResponse?: (response: unknown) => void;
  /** @deprecated Alias transitorio de `onResponse`; lo manda `RenderActivity` hasta U9d. */
  readonly onComplete?: (response: unknown) => void;
}

export const AHORCADO_TIPO = "ahorcado" as const;
