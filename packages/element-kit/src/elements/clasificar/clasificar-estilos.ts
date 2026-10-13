import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { ClasificarEstado } from "./clasificar-types.js";

/** U9b.2 — estilos de Clasificar: solo `ajustes` (los colores de categoría son datos del editor). */
export const PRESETS_CLASIFICAR = crearPresetsDeEstilo<ClasificarEstado>(
  CAPACIDADES_AJUSTES.clasificar!,
);
