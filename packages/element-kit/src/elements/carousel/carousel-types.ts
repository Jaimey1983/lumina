import type { CarouselWidget } from "../../widgets/carousel/index.js";
import type { WidgetCanvasConfig } from "../_shared/widget-runtime-config.js";

export type CarouselEstado = CarouselWidget;

/**
 * Configuración del runtime; la apariencia pertenece al estado legacy.
 * G-scale.5: sin `isThumbnail` — miniatura escala el mismo widget (VirtualSlideSurface).
 */
export type CarouselConfig = WidgetCanvasConfig;

export const CAROUSEL_TIPO = "carousel" as const;
