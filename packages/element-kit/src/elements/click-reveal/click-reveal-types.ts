import type { ClickRevealWidgetT13 } from "../../widgets/click-reveal/index.js";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

export type ClickRevealEstado = ClickRevealWidgetT13;

/** Configuración del runtime; la apariencia pertenece al estado legacy. */
export type ClickRevealConfig = WidgetCanvasConfig;

export const CLICK_REVEAL_TIPO = "click-reveal" as const;
