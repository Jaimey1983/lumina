import type { GlobosActivity } from "../../activities/globos/index.js";

/** Estado del elemento Globos = la actividad completa. */
export type GlobosEstado = GlobosActivity;

/** Config de runtime del viewer. */
export interface GlobosConfig {
  /** Canal de respuesta unificado (etapa U / DU2). */
  readonly onResponse?: (response: unknown) => void;
  /** @deprecated Alias transitorio de `onResponse`; lo manda `RenderActivity` hasta U9d. */
  readonly onComplete?: (response: unknown) => void;
}

export const GLOBOS_TIPO = "globos" as const;
