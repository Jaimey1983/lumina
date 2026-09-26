import type { TimelineWidget } from "../../widgets/timeline/index.js";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

export type TimelineEstado = TimelineWidget;

/**
 * Configuración del runtime; la apariencia pertenece al estado legacy.
 * G-scale.5: sin `isThumbnail` — miniatura escala el mismo timeline (VirtualSlideSurface).
 */
export type TimelineConfig = WidgetCanvasConfig;

export const TIMELINE_TIPO = "timeline" as const;
