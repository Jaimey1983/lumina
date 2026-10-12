import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { PuzzlePalabrasEstado } from "./puzzle_palabras-types.js";

/** U9b.1 — estilos de Puzzle de palabras: solo `ajustes` (no tiene datos de aspecto propios). */
export const PRESETS_PUZZLE_PALABRAS = crearPresetsDeEstilo<PuzzlePalabrasEstado>(
  CAPACIDADES_AJUSTES.puzzle_palabras!,
);
