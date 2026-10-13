import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { AhorcadoEstado } from "./ahorcado-types.js";

/** U9c.1 — estilos de Ahorcado: solo `ajustes` (los datos del editor no son ajustes comunes). */
export const PRESETS_AHORCADO = crearPresetsDeEstilo<AhorcadoEstado>(
  CAPACIDADES_AJUSTES.ahorcado!,
);
