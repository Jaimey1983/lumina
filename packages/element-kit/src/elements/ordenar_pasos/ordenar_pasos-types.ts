import type { Activity } from "lumina-frontend/editor-activities";

/** Estado del elemento ordenar_pasos = la actividad completa. */
export type OrdenarPasosEstado = Activity;

/** Config de runtime del viewer (onResponse / variant), no apariencia del panel. */
export type { ClassicConfig as OrdenarPasosConfig } from "../_shared/classic-adapters.js";

export const ORDENAR_PASOS_TIPO = "ordenar_pasos" as const;
