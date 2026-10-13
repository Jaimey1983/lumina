import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { NubePalabrasEstado } from "./nube_palabras-types.js";

/** U9a.5 — estilos de Nube de palabras: solo `ajustes` (no tiene datos de aspecto propios). */
export const PRESETS_NUBE_PALABRAS = crearPresetsDeEstilo<NubePalabrasEstado>(
  CAPACIDADES_AJUSTES.nube_palabras!,
);
