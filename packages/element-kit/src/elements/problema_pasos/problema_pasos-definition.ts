import { evaluateActivityResponse } from "@lumina/scoring";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { createDefaultProblemaPasos } from "../../activities/problema-pasos/index.js";
import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import {
  ProblemaPasosEditor,
  ProblemaPasosPropiedades as PropiedadesBase,
  ProblemaPasosViewer,
} from "./problema_pasos-adapters.js";
import { PRESETS_PROBLEMA_PASOS } from "./problema_pasos-estilos.js";
import {
  PROBLEMA_PASOS_TIPO,
  type ProblemaPasosConfig,
  type ProblemaPasosEstado,
} from "./problema_pasos-types.js";

/** El panel suma estilos, ajustes comunes y el panel de producción (U12) al editor de siempre. */
const ProblemaPasosPropiedades = crearPropiedadesConAjustes(PropiedadesBase, {
  presets: PRESETS_PROBLEMA_PASOS,
  storageKey: "actividad.problema_pasos.estilos",
});

/** Delegado puro a `@lumina/scoring`. */
export function evaluarProblemaPasos(estado: ProblemaPasosEstado, respuesta: unknown) {
  return evaluateActivityResponse("problema_pasos", estado, respuesta);
}

/** U15 — Problema paso a paso como `ElementDefinition` evaluable (scoring `partial`). */
export const problemaPasosDefinition = {
  tipo: PROBLEMA_PASOS_TIPO,
  crearPorDefecto: () => createDefaultProblemaPasos(),
  Editor: ProblemaPasosEditor,
  Viewer: ProblemaPasosViewer,
  Propiedades: ProblemaPasosPropiedades,
  // El estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento propio.
  apariencia: { color: true, tipografia: false, animacion: false },
  presets: PRESETS_PROBLEMA_PASOS,
  puntuacion: (estado: ProblemaPasosEstado, respuesta?: unknown) =>
    evaluarProblemaPasos(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["problema_pasos"],
  // Etapa K / K7a: la actividad avisa al motor si la respuesta fue correcta (flujo, no nota).
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
} as const satisfies ElementDefinition<ProblemaPasosEstado, ProblemaPasosConfig>;

export type ProblemaPasosDefinition = typeof problemaPasosDefinition;
