import type { CarouselWidget } from "lumina-frontend/widgets/carousel";

export type CarouselEstado = CarouselWidget;

/** Configuración del runtime; la apariencia pertenece al estado legacy. */
export interface CarouselConfig {
  readonly isThumbnail?: boolean;
}

export const CAROUSEL_TIPO = "carousel" as const;
