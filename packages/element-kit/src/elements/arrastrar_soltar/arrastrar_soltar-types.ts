import type { Activity } from "lumina-frontend/editor-activities";

/** Estado del elemento arrastrar_soltar = la actividad completa. */
export type ArrastrarSoltarEstado = Activity;

/** Config de runtime del viewer (onResponse / variant), no apariencia del panel. */
export type { ClassicConfig as ArrastrarSoltarConfig } from "../_shared/classic-adapters.js";

export const ARRASTRAR_SOLTAR_TIPO = "arrastrar_soltar" as const;
