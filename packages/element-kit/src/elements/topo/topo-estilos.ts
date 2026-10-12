import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { TopoEstado } from "./topo-types.js";

/** U9d.2 — estilos de Topo: solo `ajustes` (los datos del editor no son ajustes comunes). */
export const PRESETS_TOPO = crearPresetsDeEstilo<TopoEstado>(
  CAPACIDADES_AJUSTES.topo!,
);
