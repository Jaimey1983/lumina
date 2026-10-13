import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { HistoriaRamificadaEstado } from "./historia_ramificada-types.js";

/** U9d.4 — estilos de Historia ramificada: solo `ajustes` (los datos del editor no son ajustes comunes). */
export const PRESETS_HISTORIA_RAMIFICADA = crearPresetsDeEstilo<HistoriaRamificadaEstado>(
  CAPACIDADES_AJUSTES.historia_ramificada!,
);
