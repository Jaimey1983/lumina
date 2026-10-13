import type { PuzzleImagenActivity } from "../../activities/puzzle-imagen/index.js";

/** Estado del elemento PuzzleImagen = la actividad completa. */
export type PuzzleImagenEstado = PuzzleImagenActivity;

/** Config de runtime del viewer. */
export interface PuzzleImagenConfig {
  /** Canal de respuesta unificado (etapa U / DU2). */
  readonly onResponse?: (response: unknown) => void;
}

export const PUZZLE_IMAGEN_TIPO = "puzzle_imagen" as const;
