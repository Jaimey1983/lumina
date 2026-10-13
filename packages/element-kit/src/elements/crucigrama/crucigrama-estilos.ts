import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { CrucigramaEstado } from "./crucigrama-types.js";

/** U9c.3 — estilos de Crucigrama: solo `ajustes` (los datos del editor no son ajustes comunes). */
export const PRESETS_CRUCIGRAMA = crearPresetsDeEstilo<CrucigramaEstado>(
  CAPACIDADES_AJUSTES.crucigrama!,
);
