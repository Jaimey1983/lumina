import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { ProblemaPasosEstado } from "./problema_pasos-types.js";

/** U15 — estilos de Problema paso a paso: solo `ajustes` (los datos del editor no son ajustes comunes). */
export const PRESETS_PROBLEMA_PASOS = crearPresetsDeEstilo<ProblemaPasosEstado>(
  CAPACIDADES_AJUSTES.problema_pasos!,
);
