import type { FlipCardsWidget } from "../../widgets/flip-cards/index.js";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

export type FlipCardsEstado = FlipCardsWidget;

/** Configuración del runtime; la apariencia pertenece al estado legacy. */
export type FlipCardsConfig = WidgetCanvasConfig;

export const FLIP_CARDS_TIPO = "flip-cards" as const;
