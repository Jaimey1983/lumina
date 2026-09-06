import type { TooltipWidget } from "lumina-frontend/widgets/tooltip";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

/** Estado del elemento Tooltip = el bloque de widget completo. */
export type TooltipEstado = TooltipWidget;

/**
 * Config de runtime del viewer (no es apariencia del panel).
 * `isThumbnail` desactiva interacción — mismo contrato que `TooltipViewer`.
 */
export type TooltipConfig = WidgetCanvasConfig;

export const TOOLTIP_TIPO = "tooltip" as const;
