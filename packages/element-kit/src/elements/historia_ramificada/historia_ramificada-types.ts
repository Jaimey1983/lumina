import type { HistoriaRamificadaActivity } from "../../activities/historia-ramificada/index.js";

/** Estado del elemento HistoriaRamificada = la actividad completa. */
export type HistoriaRamificadaEstado = HistoriaRamificadaActivity;

/** Config de runtime del viewer. `onComplete` se reenvía al legacy. */
export interface HistoriaRamificadaConfig {
  readonly onComplete?: (response: unknown) => void;
}

export const HISTORIA_RAMIFICADA_TIPO = "historia_ramificada" as const;
