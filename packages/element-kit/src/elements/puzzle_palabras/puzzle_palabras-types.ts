import type { PuzzlePalabrasActivity } from "../../activities/puzzle-palabras/index.js";

/** Estado del elemento PuzzlePalabras = la actividad completa. */
export type PuzzlePalabrasEstado = PuzzlePalabrasActivity;

/** Config de runtime del viewer. `onComplete` se reenvía al legacy. */
export interface PuzzlePalabrasConfig {
  readonly onComplete?: (response: unknown) => void;
}

export const PUZZLE_PALABRAS_TIPO = "puzzle_palabras" as const;
