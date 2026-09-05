import type { ReactElement } from "react";

/** Superficie usada por el adapter durante el build aislado; test comprueba los tipos reales. */
export interface CarouselWidget {
  tipo: "carousel";
  tituloWidget?: string;
  subtituloWidget?: string;
  instruccion?: string;
  configuracion: Record<string, unknown>;
  slides: { id: string }[];
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  zIndex?: number;
}
export declare function createDefaultCarouselBlock(): CarouselWidget;
export declare function normalizeCarouselWidget(
  block: CarouselWidget,
): CarouselWidget;
export declare function CarouselEditor(props: {
  block: CarouselWidget;
  onChange: (block: CarouselWidget) => void;
  onEnsureBlockSelected?: () => void;
  innerSelection?: null;
  onInnerSelectionChange?: (selection: null) => void;
}): ReactElement;
export declare function CarouselViewer(props: {
  block: CarouselWidget;
  isThumbnail?: boolean;
}): ReactElement;
export declare function CarouselProperties(props: {
  block: CarouselWidget;
  applyNow: (fn: (block: CarouselWidget) => CarouselWidget) => Promise<void>;
}): ReactElement;
