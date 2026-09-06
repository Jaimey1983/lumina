import type { ClickRevealWidget } from "lumina-frontend/widgets/click-reveal";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

export type ClickRevealEstado = ClickRevealWidget;

/** Configuración del runtime; la apariencia pertenece al estado legacy. */
export type ClickRevealConfig = WidgetCanvasConfig;

export const CLICK_REVEAL_TIPO = "click-reveal" as const;
