import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { CompletarBlancosEstado } from "./completar_blancos-types.js";

/** U9a.3 — estilos de Completar blancos: solo `ajustes` (no tiene datos de aspecto propios). */
export const PRESETS_COMPLETAR_BLANCOS = crearPresetsDeEstilo<CompletarBlancosEstado>(
  CAPACIDADES_AJUSTES.completar_blancos!,
);
