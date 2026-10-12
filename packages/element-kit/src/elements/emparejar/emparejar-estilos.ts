import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { EmparejarEstado } from "./emparejar-types.js";

/** U9b.3 — estilos de Emparejar: solo `ajustes` (no tiene datos de aspecto propios). */
export const PRESETS_EMPAREJAR = crearPresetsDeEstilo<EmparejarEstado>(
  CAPACIDADES_AJUSTES.emparejar!,
);
