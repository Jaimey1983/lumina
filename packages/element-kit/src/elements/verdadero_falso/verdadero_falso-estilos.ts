import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { VerdaderoFalsoEstado } from "./verdadero_falso-types.js";

/** U8 — estilos de Verdadero/Falso: solo `ajustes` (no tiene datos de aspecto propios). */
export const PRESETS_VERDADERO_FALSO = crearPresetsDeEstilo<VerdaderoFalsoEstado>(
  CAPACIDADES_AJUSTES.verdadero_falso!,
);
