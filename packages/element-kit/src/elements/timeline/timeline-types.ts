import type { TimelineWidget } from "lumina-frontend/widgets/timeline";

export type TimelineEstado = TimelineWidget;

/** Configuración del runtime; la apariencia pertenece al estado legacy. */
export interface TimelineConfig {
  readonly isThumbnail?: boolean;
}

export const TIMELINE_TIPO = "timeline" as const;
