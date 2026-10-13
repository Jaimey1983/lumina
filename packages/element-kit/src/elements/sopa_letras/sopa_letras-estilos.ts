import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { SopaLetrasEstado } from "./sopa_letras-types.js";

/** U9c.4 — estilos de Sopa de letras: solo `ajustes` (los datos del editor no son ajustes comunes). */
export const PRESETS_SOPA_LETRAS = crearPresetsDeEstilo<SopaLetrasEstado>(
  CAPACIDADES_AJUSTES.sopa_letras!,
);
