import { CATALOGO_ELEMENTOS } from "../_shared/catalogo.js";
import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultPuzzlePalabras } from "lumina-frontend/activities/puzzle-palabras";
import type { ElementDefinition } from "@lumina/element-kit-core";
import {
  PuzzlePalabrasEditor,
  PuzzlePalabrasPropiedades,
  PuzzlePalabrasViewer,
} from "./puzzle_palabras-adapters.js";
import { PUZZLE_PALABRAS_TIPO, type PuzzlePalabrasConfig, type PuzzlePalabrasEstado } from "./puzzle_palabras-types.js";

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
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: PuzzlePalabrasEstado, respuesta?: unknown) =>
    evaluarPuzzlePalabras(estado, respuesta).score ?? 0,
  catalogo: CATALOGO_ELEMENTOS["puzzle_palabras"],
} as const satisfies ElementDefinition<PuzzlePalabrasEstado, PuzzlePalabrasConfig>;

export type PuzzlePalabrasDefinition = typeof puzzlePalabrasDefinition;
