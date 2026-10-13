import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { RespuestaMatematicaEstado } from "./respuesta_matematica-types.js";

/** U9a.2 — estilos de Respuesta matemática: solo `ajustes` (no tiene datos de aspecto propios). */
export const PRESETS_RESPUESTA_MATEMATICA = crearPresetsDeEstilo<RespuestaMatematicaEstado>(
  CAPACIDADES_AJUSTES.respuesta_matematica!,
);
