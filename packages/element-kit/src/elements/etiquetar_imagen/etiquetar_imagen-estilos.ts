import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { EtiquetarImagenEstado } from "./etiquetar_imagen-types.js";

/** U16 — estilos de Etiquetar imagen: solo `ajustes` (los datos del editor no son ajustes comunes). */
export const PRESETS_ETIQUETAR_IMAGEN = crearPresetsDeEstilo<EtiquetarImagenEstado>(
  CAPACIDADES_AJUSTES.etiquetar_imagen!,
);
