import type { TimelineWidgetT14 } from "../../widgets/timeline/index.js";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

export type TimelineEstado = TimelineWidgetT14;

/** Configuración del runtime; la apariencia pertenece al estado legacy. */
export type TimelineConfig = WidgetCanvasConfig;

export const TIMELINE_TIPO = "timeline" as const;
