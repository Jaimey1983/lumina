import type { FlipCardsWidget } from "lumina-frontend/widgets/flip-cards";

export type FlipCardsEstado = FlipCardsWidget;

/** Configuración del runtime; la apariencia pertenece al estado legacy. */
export interface FlipCardsConfig {
  readonly isThumbnail?: boolean;
}

export const FLIP_CARDS_TIPO = "flip-cards" as const;
