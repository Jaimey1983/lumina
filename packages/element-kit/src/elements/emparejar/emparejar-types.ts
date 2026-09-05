import type { Activity } from "lumina-frontend/editor-activities";

/** Estado del elemento emparejar = la actividad completa. */
export type EmparejarEstado = Activity;

/** Config de runtime del viewer (onResponse / variant), no apariencia del panel. */
export type { ClassicConfig as EmparejarConfig } from "../_shared/classic-adapters.js";

export const EMPAREJAR_TIPO = "emparejar" as const;
