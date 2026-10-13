import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { LineaTiempoEstado } from "./linea_tiempo-types.js";

/** U17 — estilos de Línea de tiempo: solo `ajustes` (los datos del editor no son ajustes comunes). */
export const PRESETS_LINEA_TIEMPO = crearPresetsDeEstilo<LineaTiempoEstado>(
  CAPACIDADES_AJUSTES.linea_tiempo!,
);
