import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultHistoriaRamificada } from "../../activities/historia-ramificada/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_HISTORIA_RAMIFICADA } from "./historia_ramificada-estilos.js";
import {
  HistoriaRamificadaEditor,
  HistoriaRamificadaPropiedades as HistoriaRamificadaPropiedadesBase,
  HistoriaRamificadaViewer,
} from "./historia_ramificada-adapters.js";
import { HISTORIA_RAMIFICADA_TIPO, type HistoriaRamificadaConfig, type HistoriaRamificadaEstado } from "./historia_ramificada-types.js";

/** U9d.4: el panel suma estilos y ajustes comunes al panel de siempre. */
const HistoriaRamificadaPropiedades = crearPropiedadesConAjustes(HistoriaRamificadaPropiedadesBase, {
  presets: PRESETS_HISTORIA_RAMIFICADA,
  storageKey: "actividad.historia_ramificada.estilos",
});

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
  // U9d.4: el estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento.
  apariencia: {
    color: true,
    tipografia: false,
    animacion: false,
  },
  presets: PRESETS_HISTORIA_RAMIFICADA,
  puntuacion: (estado: HistoriaRamificadaEstado, respuesta?: unknown) =>
    evaluarHistoriaRamificada(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["historia_ramificada"],
  // Etapa K / K7a: la actividad avisa al motor si la respuesta fue correcta (flujo, no nota).
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
} as const satisfies ElementDefinition<HistoriaRamificadaEstado, HistoriaRamificadaConfig>;

export type HistoriaRamificadaDefinition = typeof historiaRamificadaDefinition;
