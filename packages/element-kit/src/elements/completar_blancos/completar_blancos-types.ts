import type { Activity } from "lumina-frontend/editor-activities";

/** Estado del elemento completar_blancos = la actividad completa. */
export type CompletarBlancosEstado = Activity;

/** Config de runtime del viewer (onResponse / variant), no apariencia del panel. */
export type { ClassicConfig as CompletarBlancosConfig } from "../_shared/classic-adapters.js";

export const COMPLETAR_BLANCOS_TIPO = "completar_blancos" as const;
