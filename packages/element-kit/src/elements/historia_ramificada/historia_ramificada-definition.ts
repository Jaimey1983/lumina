import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultHistoriaRamificada } from "lumina-frontend/activities/historia-ramificada";
import type { ElementDefinition } from "../../contract.js";
import {
  HistoriaRamificadaEditor,
  HistoriaRamificadaPropiedades,
  HistoriaRamificadaViewer,
} from "./historia_ramificada-adapters.js";
import { HISTORIA_RAMIFICADA_TIPO, type HistoriaRamificadaConfig, type HistoriaRamificadaEstado } from "./historia_ramificada-types.js";

/** Delegado puro a `@lumina/scoring`. */
export function evaluarHistoriaRamificada(estado: HistoriaRamificadaEstado, respuesta: unknown) {
  return evaluateActivityResponse("historia_ramificada", estado, respuesta);
}

/** E2.4 — HistoriaRamificada como `ElementDefinition` evaluable. */
export const historiaRamificadaDefinition = {
  tipo: HISTORIA_RAMIFICADA_TIPO,
  crearPorDefecto: () => createDefaultHistoriaRamificada(),
  Editor: HistoriaRamificadaEditor,
  Viewer: HistoriaRamificadaViewer,
  Propiedades: HistoriaRamificadaPropiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: HistoriaRamificadaEstado, respuesta?: unknown) =>
    evaluarHistoriaRamificada(estado, respuesta).score ?? 0,
} as const satisfies ElementDefinition<HistoriaRamificadaEstado, HistoriaRamificadaConfig>;

export type HistoriaRamificadaDefinition = typeof historiaRamificadaDefinition;
