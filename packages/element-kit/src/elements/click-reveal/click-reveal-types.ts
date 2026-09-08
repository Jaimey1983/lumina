import type { ClickRevealWidget } from "../../widgets/click-reveal/index.js";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

export type ClickRevealEstado = ClickRevealWidget;

/** Configuración del runtime; la apariencia pertenece al estado legacy. */
export type ClickRevealConfig = WidgetCanvasConfig;

export const CLICK_REVEAL_TIPO = "click-reveal" as const;
