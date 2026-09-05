import type { TooltipWidget } from "lumina-frontend/widgets/tooltip";

/** Estado del elemento Tooltip = el bloque de widget completo. */
export type TooltipEstado = TooltipWidget;

/**
 * Config de runtime del viewer (no es apariencia del panel).
 * `isThumbnail` desactiva interacción — mismo contrato que `TooltipViewer`.
 */
export interface TooltipConfig {
  readonly isThumbnail?: boolean;
}

export const TOOLTIP_TIPO = "tooltip" as const;
