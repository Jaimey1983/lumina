import { evaluateActivityResponse } from "@lumina/scoring";
import { createDefaultPuzzleImagen } from "lumina-frontend/activities/puzzle-imagen";
import type { ElementDefinition } from "../../contract.js";
import {
  PuzzleImagenEditor,
  PuzzleImagenPropiedades,
  PuzzleImagenViewer,
} from "./puzzle_imagen-adapters.js";
import { PUZZLE_IMAGEN_TIPO, type PuzzleImagenConfig, type PuzzleImagenEstado } from "./puzzle_imagen-types.js";

/** Delegado puro a `@lumina/scoring`. */
export function evaluarPuzzleImagen(estado: PuzzleImagenEstado, respuesta: unknown) {
  return evaluateActivityResponse("puzzle_imagen", estado, respuesta);
}

/** E2.4 — PuzzleImagen como `ElementDefinition` evaluable. */
export const puzzleImagenDefinition = {
  tipo: PUZZLE_IMAGEN_TIPO,
  crearPorDefecto: () => createDefaultPuzzleImagen(),
  Editor: PuzzleImagenEditor,
  Viewer: PuzzleImagenViewer,
  Propiedades: PuzzleImagenPropiedades,
  apariencia: {
    color: false,
    tipografia: false,
    animacion: false,
  },
  puntuacion: (estado: PuzzleImagenEstado, respuesta?: unknown) =>
    evaluarPuzzleImagen(estado, respuesta).score ?? 0,
} as const satisfies ElementDefinition<PuzzleImagenEstado, PuzzleImagenConfig>;

export type PuzzleImagenDefinition = typeof puzzleImagenDefinition;
