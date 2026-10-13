import type { ClozeBancoActivity } from "../../activities/cloze-banco/index.js";

/** Estado del elemento = la actividad completa. */
export type ClozeBancoEstado = ClozeBancoActivity;

/** Config de runtime del viewer. */
export interface ClozeBancoConfig {
  /** Canal de respuesta unificado (etapa U / DU2). */
  readonly onResponse?: (response: unknown) => void;
}

export const CLOZE_BANCO_TIPO = "cloze_banco" as const;
