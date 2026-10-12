import { CAPACIDADES_AJUSTES } from "../../activities/_shared/activity-ajustes-capacidades.js";
import { crearPresetsDeEstilo } from "../../activities/_shared/activity-estilos.js";
import type { VideoInteractivoEstado } from "./video_interactivo-types.js";

/** U9d.5 — estilos de Video interactivo: solo `ajustes` (no tiene datos de aspecto propios). */
export const PRESETS_VIDEO_INTERACTIVO = crearPresetsDeEstilo<VideoInteractivoEstado>(
  CAPACIDADES_AJUSTES.video_interactivo!,
);
