import type { PuzzleImagenActivity } from "lumina-frontend/activities/puzzle-imagen";

/** Estado del elemento PuzzleImagen = la actividad completa. */
export type PuzzleImagenEstado = PuzzleImagenActivity;

/** Config de runtime del viewer. `onComplete` se reenvía al legacy. */
export interface PuzzleImagenConfig {
  readonly onComplete?: (response: unknown) => void;
}

export const PUZZLE_IMAGEN_TIPO = "puzzle_imagen" as const;
