import type { Activity } from "lumina-frontend/editor-activities";

/** Estado del elemento nube_palabras = la actividad completa. */
export type NubePalabrasEstado = Activity;

/** Config de runtime del viewer (onResponse / variant), no apariencia del panel. */
export type { ClassicConfig as NubePalabrasConfig } from "../_shared/classic-adapters.js";

export const NUBE_PALABRAS_TIPO = "nube_palabras" as const;
