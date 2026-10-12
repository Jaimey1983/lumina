import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { ShortAnswerEstado } from "./short_answer-types.js";

/** U9a.1 — estilos de Respuesta corta: solo `ajustes` (no tiene datos de aspecto propios). */
export const PRESETS_SHORT_ANSWER = crearPresetsDeEstilo<ShortAnswerEstado>(
  CAPACIDADES_AJUSTES.short_answer!,
);
