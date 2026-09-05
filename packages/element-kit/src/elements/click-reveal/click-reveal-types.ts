import type { ClickRevealWidget } from "lumina-frontend/widgets/click-reveal";

export type ClickRevealEstado = ClickRevealWidget;

/** Configuración del runtime; la apariencia pertenece al estado legacy. */
export interface ClickRevealConfig {
  readonly isThumbnail?: boolean;
}

export const CLICK_REVEAL_TIPO = "click-reveal" as const;
