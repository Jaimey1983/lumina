import type { HistoriaRamificadaActivity } from "../../activities/historia-ramificada/index.js";

/** Estado del elemento HistoriaRamificada = la actividad completa. */
export type HistoriaRamificadaEstado = HistoriaRamificadaActivity;

/** Config de runtime del viewer. */
export interface HistoriaRamificadaConfig {
  /** Canal de respuesta unificado (etapa U / DU2). */
  readonly onResponse?: (response: unknown) => void;
}

export const HISTORIA_RAMIFICADA_TIPO = "historia_ramificada" as const;
