import type { TimelineWidget } from "lumina-frontend/widgets/timeline";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

export type TimelineEstado = TimelineWidget;

/** Configuración del runtime; la apariencia pertenece al estado legacy. */
export type TimelineConfig = WidgetCanvasConfig;

export const TIMELINE_TIPO = "timeline" as const;
