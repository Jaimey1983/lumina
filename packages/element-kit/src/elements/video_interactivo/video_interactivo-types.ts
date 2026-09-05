import type { Activity } from "lumina-frontend/editor-activities";

/** Estado del elemento video_interactivo = la actividad completa. */
export type VideoInteractivoEstado = Activity;

/** Config de runtime del viewer (onResponse / variant), no apariencia del panel. */
export type { ClassicConfig as VideoInteractivoConfig } from "../_shared/classic-adapters.js";

export const VIDEO_INTERACTIVO_TIPO = "video_interactivo" as const;
