import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { UbicarElementoActivity } from "@lumina/types/slide";

/** U9a.8 — estilos de Ubicar elemento: solo `ajustes` (no tiene datos de aspecto propios). */
export const PRESETS_UBICAR_ELEMENTO = crearPresetsDeEstilo<UbicarElementoActivity>(
  CAPACIDADES_AJUSTES.ubicar_elemento!,
);
