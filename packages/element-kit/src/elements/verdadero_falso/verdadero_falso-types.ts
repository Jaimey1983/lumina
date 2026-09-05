import type { Activity } from "lumina-frontend/editor-activities";

/** Estado del elemento verdadero_falso = la actividad completa. */
export type VerdaderoFalsoEstado = Activity;

/** Config de runtime del viewer (onResponse / variant), no apariencia del panel. */
export type { ClassicConfig as VerdaderoFalsoConfig } from "../_shared/classic-adapters.js";

export const VERDADERO_FALSO_TIPO = "verdadero_falso" as const;
