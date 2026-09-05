import type { Activity } from "lumina-frontend/editor-activities";

/** Estado del elemento quiz_multiple = la actividad completa. */
export type QuizMultipleEstado = Activity;

/** Config de runtime del viewer (onResponse / variant), no apariencia del panel. */
export type { ClassicConfig as QuizMultipleConfig } from "../_shared/classic-adapters.js";

export const QUIZ_MULTIPLE_TIPO = "quiz_multiple" as const;
