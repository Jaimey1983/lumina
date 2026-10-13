import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { QuizMultipleEstado } from "./quiz_multiple-types.js";

/** U9d.6b — estilos del Quiz: solo `ajustes` (no tiene datos de aspecto propios). */
export const PRESETS_QUIZ_MULTIPLE = crearPresetsDeEstilo<QuizMultipleEstado>(
  CAPACIDADES_AJUSTES.quiz_multiple!,
);
