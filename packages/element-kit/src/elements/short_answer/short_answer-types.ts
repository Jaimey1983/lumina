import type { Activity } from "lumina-frontend/editor-activities";

/** Estado del elemento short_answer = la actividad completa. */
export type ShortAnswerEstado = Activity;

/** Config de runtime del viewer (onResponse / variant), no apariencia del panel. */
export type { ClassicConfig as ShortAnswerConfig } from "../_shared/classic-adapters.js";

export const SHORT_ANSWER_TIPO = "short_answer" as const;
