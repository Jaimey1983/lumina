import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { ArrastrarSoltarEstado } from "./arrastrar_soltar-types.js";

/** U9b.6 — estilos de Arrastrar y soltar: solo `ajustes` (no tiene datos de aspecto propios). */
export const PRESETS_ARRASTRAR_SOLTAR = crearPresetsDeEstilo<ArrastrarSoltarEstado>(
  CAPACIDADES_AJUSTES.arrastrar_soltar!,
);
