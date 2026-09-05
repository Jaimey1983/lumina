import type { ReactElement } from "react";

/** Superficie usada por el adapter durante el build aislado; test comprueba los tipos reales. */
export interface FlipCardsWidget {
  tipo: "flip-cards";
  tituloWidget?: string;
  subtituloWidget?: string;
  instruccion?: string;
  configuracion: Record<string, unknown>;
  tarjetas: { id: string }[];
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  zIndex?: number;
}
export declare function createDefaultFlipCardsBlock(): FlipCardsWidget;
export declare function normalizeFlipCardsWidget(
  block: FlipCardsWidget,
): FlipCardsWidget;
export declare function FlipCardsEditor(props: {
  block: FlipCardsWidget;
  onChange: (block: FlipCardsWidget) => void;
  onEnsureBlockSelected?: () => void;
  innerSelection?: null;
  onInnerSelectionChange?: (selection: null) => void;
}): ReactElement;
export declare function FlipCardsViewer(props: {
  block: FlipCardsWidget;
  isThumbnail?: boolean;
}): ReactElement;
export declare function FlipCardsProperties(props: {
  block: FlipCardsWidget;
  applyNow: (fn: (block: FlipCardsWidget) => FlipCardsWidget) => Promise<void>;
}): ReactElement;
