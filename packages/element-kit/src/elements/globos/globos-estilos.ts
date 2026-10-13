import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { GlobosEstado } from "./globos-types.js";

/** U9d.1 — estilos de Globos: solo `ajustes` (los datos del editor no son ajustes comunes). */
export const PRESETS_GLOBOS = crearPresetsDeEstilo<GlobosEstado>(
  CAPACIDADES_AJUSTES.globos!,
);
