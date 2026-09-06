import type { CarouselWidget } from "lumina-frontend/widgets/carousel";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

export type CarouselEstado = CarouselWidget;

/** Configuración del runtime; la apariencia pertenece al estado legacy. */
export type CarouselConfig = WidgetCanvasConfig;

export const CAROUSEL_TIPO = "carousel" as const;
