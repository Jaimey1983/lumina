import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { OrdenarPasosEstado } from "./ordenar_pasos-types.js";

/** U9b.4 — estilos de Ordenar pasos: solo `ajustes` (no tiene datos de aspecto propios). */
export const PRESETS_ORDENAR_PASOS = crearPresetsDeEstilo<OrdenarPasosEstado>(
  CAPACIDADES_AJUSTES.ordenar_pasos!,
);
