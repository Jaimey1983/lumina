import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { EncuestaVivaEstado } from "./encuesta_viva-types.js";

/** U9a.4 — estilos de Encuesta viva: solo `ajustes` (no tiene datos de aspecto propios). */
export const PRESETS_ENCUESTA_VIVA = crearPresetsDeEstilo<EncuestaVivaEstado>(
  CAPACIDADES_AJUSTES.encuesta_viva!,
);
