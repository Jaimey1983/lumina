import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { AbrirCajaEstado } from "./abrir_caja-types.js";

/** U9d.3 — estilos de Abrir la caja: solo `ajustes` (los datos del editor no son ajustes comunes). */
export const PRESETS_ABRIR_CAJA = crearPresetsDeEstilo<AbrirCajaEstado>(
  CAPACIDADES_AJUSTES.abrir_caja!,
);
