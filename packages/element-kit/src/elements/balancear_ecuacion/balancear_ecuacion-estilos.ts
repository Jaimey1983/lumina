import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { BalancearEcuacionActivity } from "@lumina/types/slide";

/** U9a.6 — estilos de Balancear ecuación: solo `ajustes` (no tiene datos de aspecto propios). */
export const PRESETS_BALANCEAR_ECUACION = crearPresetsDeEstilo<BalancearEcuacionActivity>(
  CAPACIDADES_AJUSTES.balancear_ecuacion!,
);
