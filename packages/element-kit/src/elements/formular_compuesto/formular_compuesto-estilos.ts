import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { FormularCompuestoActivity } from "@lumina/types/slide";

/** U9a.7 — estilos de Formular compuesto: solo `ajustes` (no tiene datos de aspecto propios). */
export const PRESETS_FORMULAR_COMPUESTO = crearPresetsDeEstilo<FormularCompuestoActivity>(
  CAPACIDADES_AJUSTES.formular_compuesto!,
);
