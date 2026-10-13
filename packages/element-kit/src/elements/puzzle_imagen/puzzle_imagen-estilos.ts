import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { PuzzleImagenEstado } from "./puzzle_imagen-types.js";

/** U9b.5 — estilos de Puzzle de imagen: solo `ajustes` (dificultad y vista son datos del editor). */
export const PRESETS_PUZZLE_IMAGEN = crearPresetsDeEstilo<PuzzleImagenEstado>(
  CAPACIDADES_AJUSTES.puzzle_imagen!,
);
