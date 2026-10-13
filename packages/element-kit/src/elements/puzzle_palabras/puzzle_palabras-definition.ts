import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultPuzzlePalabras } from "../../activities/puzzle-palabras/index.js";
import type { ElementDefinition } from "@lumina/element-kit-core";
import { crearPropiedadesConAjustes } from "../_shared/propiedades-con-ajustes.js";
import { PRESETS_PUZZLE_PALABRAS } from "./puzzle_palabras-estilos.js";
import {
  PuzzlePalabrasEditor,
  PuzzlePalabrasPropiedades as PuzzlePalabrasPropiedadesBase,
  PuzzlePalabrasViewer,
} from "./puzzle_palabras-adapters.js";
import { PUZZLE_PALABRAS_TIPO, type PuzzlePalabrasConfig, type PuzzlePalabrasEstado } from "./puzzle_palabras-types.js";

/** U9b.1: el panel suma estilos y ajustes comunes al panel de siempre (oraciones y pistas). */
const PuzzlePalabrasPropiedades = crearPropiedadesConAjustes(PuzzlePalabrasPropiedadesBase, {
  presets: PRESETS_PUZZLE_PALABRAS,
  storageKey: "actividad.puzzle_palabras.estilos",
});

/** Delegado puro a `@lumina/scoring`. */
export function evaluarPuzzlePalabras(estado: PuzzlePalabrasEstado, respuesta: unknown) {
  return evaluateActivityResponse("puzzle_palabras", estado, respuesta);
}

/** E2.4 — PuzzlePalabras como `ElementDefinition` evaluable. */
export const puzzlePalabrasDefinition = {
  tipo: PUZZLE_PALABRAS_TIPO,
  crearPorDefecto: () => createDefaultPuzzlePalabras(),
  Editor: PuzzlePalabrasEditor,
  Viewer: PuzzlePalabrasViewer,
  Propiedades: PuzzlePalabrasPropiedades,
  // U9b.1: el estilo (`ajustes.estilo`) es color; la tipografía no se toca y no hay movimiento.
  apariencia: {
    color: true,
    tipografia: false,
    animacion: false,
  },
  presets: PRESETS_PUZZLE_PALABRAS,
  puntuacion: (estado: PuzzlePalabrasEstado, respuesta?: unknown) =>
    evaluarPuzzlePalabras(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["puzzle_palabras"],
  // Etapa K / K7a: la actividad avisa al motor si la respuesta fue correcta (flujo, no nota).
  eventos: ["respuesta_correcta", "respuesta_incorrecta"],
} as const satisfies ElementDefinition<PuzzlePalabrasEstado, PuzzlePalabrasConfig>;

export type PuzzlePalabrasDefinition = typeof puzzlePalabrasDefinition;
