import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { ClozeBancoEstado } from "./cloze_banco-types.js";

/** U18 — estilos de Cloze con banco: solo `ajustes` (los datos del editor no son ajustes comunes). */
export const PRESETS_CLOZE_BANCO = crearPresetsDeEstilo<ClozeBancoEstado>(
  CAPACIDADES_AJUSTES.cloze_banco!,
);
