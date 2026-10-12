import { evaluateActivityResponse } from "@lumina/scoring";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { createDefaultRelacionarLineas } from "../../activities/relacionar-lineas/index.js";
import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import {
  RelacionarLineasEditor,
  RelacionarLineasPropiedades as PropiedadesBase,
  RelacionarLineasViewer,
} from "./relacionar_lineas-adapters.js";
import { PRESETS_RELACIONAR_LINEAS } from "./relacionar_lineas-estilos.js";
import {
  RELACIONAR_LINEAS_TIPO,
  type RelacionarLineasConfig,
  type RelacionarLineasEstado,
} from "./relacionar_lineas-types.js";

/** El panel suma estilos, ajustes comunes y el panel de producción (U12) al editor de siempre. */
const RelacionarLineasPropiedades = crearPropiedadesConAjustes(PropiedadesBase, {
  presets: PRESETS_RELACIONAR_LINEAS,
  storageKey: "actividad.relacionar_lineas.estilos",
});

/** Delegado puro a `@lumina/scoring`. */
export function evaluarRelacionarLineas(estado: RelacionarLineasEstado, respuesta: unknown) {
  return evaluateActivityResponse("relacionar_lineas", estado, respuesta);
}

/** U14 — Relacionar con líneas como `ElementDefinition` evaluable (scoring `partial`). */
export const relacionarLineasDefinition = {
  tipo: RELACIONAR_LINEAS_TIPO,
  crearPorDefecto: () => createDefaultRelacionarLineas(),
  Editor: RelacionarLineasEditor,
  Viewer: RelacionarLineasViewer,
  Propiedades: RelacionarLineasPropiedades,
  // El estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento propio.
  apariencia: { color: true, tipografia: false, animacion: false },
  presets: PRESETS_RELACIONAR_LINEAS,
  puntuacion: (estado: RelacionarLineasEstado, respuesta?: unknown) =>
    evaluarRelacionarLineas(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["relacionar_lineas"],
  // Etapa K / K7a: la actividad avisa al motor si la respuesta fue correcta (flujo, no nota).
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
} as const satisfies ElementDefinition<RelacionarLineasEstado, RelacionarLineasConfig>;

export type RelacionarLineasDefinition = typeof relacionarLineasDefinition;
