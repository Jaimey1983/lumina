import type { PuzzlePalabrasActivity } from "../../activities/puzzle-palabras/index.js";

/** Estado del elemento PuzzlePalabras = la actividad completa. */
export type PuzzlePalabrasEstado = PuzzlePalabrasActivity;

/** Config de runtime del viewer. */
export interface PuzzlePalabrasConfig {
  /** Canal de respuesta unificado (etapa U / DU2). */
  readonly onResponse?: (response: unknown) => void;
}

export const PUZZLE_PALABRAS_TIPO = "puzzle_palabras" as const;
