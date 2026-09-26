import type { ClickRevealWidget } from "../../widgets/click-reveal/index.js";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

export type ClickRevealEstado = ClickRevealWidget;

/**
 * Configuración del runtime; la apariencia pertenece al estado legacy.
 * G-scale.5: sin `isThumbnail` — miniatura escala el mismo widget (VirtualSlideSurface).
 */
export type ClickRevealConfig = WidgetCanvasConfig;

export const CLICK_REVEAL_TIPO = "click-reveal" as const;
