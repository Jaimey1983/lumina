import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { AnagramaEstado } from "./anagrama-types.js";

/** U9c.2 — estilos de Anagrama: solo `ajustes` (los datos del editor no son ajustes comunes). */
export const PRESETS_ANAGRAMA = crearPresetsDeEstilo<AnagramaEstado>(
  CAPACIDADES_AJUSTES.anagrama!,
);
