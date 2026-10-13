import { evaluateActivityResponse } from "@lumina/scoring";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { createDefaultLineaTiempo } from "../../activities/linea-tiempo/index.js";
import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import {
  LineaTiempoEditor,
  LineaTiempoPropiedades as PropiedadesBase,
  LineaTiempoViewer,
} from "./linea_tiempo-adapters.js";
import { PRESETS_LINEA_TIEMPO } from "./linea_tiempo-estilos.js";
import {
  LINEA_TIEMPO_TIPO,
  type LineaTiempoConfig,
  type LineaTiempoEstado,
} from "./linea_tiempo-types.js";

/** El panel suma estilos, ajustes comunes y el panel de producción (U12) al editor de siempre. */
const LineaTiempoPropiedades = crearPropiedadesConAjustes(PropiedadesBase, {
  presets: PRESETS_LINEA_TIEMPO,
  storageKey: "actividad.linea_tiempo.estilos",
});

/** Delegado puro a `@lumina/scoring`. */
export function evaluarLineaTiempo(estado: LineaTiempoEstado, respuesta: unknown) {
  return evaluateActivityResponse("linea_tiempo", estado, respuesta);
}

/** U17 — Línea de tiempo como `ElementDefinition` evaluable (scoring `partial`). */
export const lineaTiempoDefinition = {
  tipo: LINEA_TIEMPO_TIPO,
  crearPorDefecto: () => createDefaultLineaTiempo(),
  Editor: LineaTiempoEditor,
  Viewer: LineaTiempoViewer,
  Propiedades: LineaTiempoPropiedades,
  // El estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento propio.
  apariencia: { color: true, tipografia: false, animacion: false },
  presets: PRESETS_LINEA_TIEMPO,
  puntuacion: (estado: LineaTiempoEstado, respuesta?: unknown) =>
    evaluarLineaTiempo(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["linea_tiempo"],
  // Etapa K / K7a: la actividad avisa al motor si la respuesta fue correcta (flujo, no nota).
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
} as const satisfies ElementDefinition<LineaTiempoEstado, LineaTiempoConfig>;

export type LineaTiempoDefinition = typeof lineaTiempoDefinition;
