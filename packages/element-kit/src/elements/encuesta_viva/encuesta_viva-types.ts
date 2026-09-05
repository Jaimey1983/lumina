import type { Activity } from "lumina-frontend/editor-activities";

/** Estado del elemento encuesta_viva = la actividad completa. */
export type EncuestaVivaEstado = Activity;

/** Config de runtime del viewer (onResponse / variant), no apariencia del panel. */
export type { ClassicConfig as EncuestaVivaConfig } from "../_shared/classic-adapters.js";

export const ENCUESTA_VIVA_TIPO = "encuesta_viva" as const;
