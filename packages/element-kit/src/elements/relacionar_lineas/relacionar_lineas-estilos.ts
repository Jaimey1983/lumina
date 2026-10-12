import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { RelacionarLineasEstado } from "./relacionar_lineas-types.js";

/** U14 — estilos de Relacionar con líneas: solo `ajustes` (los datos del editor no son ajustes comunes). */
export const PRESETS_RELACIONAR_LINEAS = crearPresetsDeEstilo<RelacionarLineasEstado>(
  CAPACIDADES_AJUSTES.relacionar_lineas!,
);
