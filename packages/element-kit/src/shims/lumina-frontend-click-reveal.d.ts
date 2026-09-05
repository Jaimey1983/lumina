import type { ReactElement } from "react";

/** Superficie usada por el adapter durante el build aislado; test comprueba los tipos reales. */
export interface ClickRevealWidget {
  tipo: "click-reveal";
  tituloWidget?: string;
  subtituloWidget?: string;
  instruccion?: string;
  configuracion: Record<string, unknown>;
  triggers: { id: string }[];
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  zIndex?: number;
}
export declare function createDefaultClickRevealBlock(): ClickRevealWidget;
export declare function normalizeClickRevealWidget(
  block: ClickRevealWidget,
): ClickRevealWidget;
export declare function ClickRevealEditor(props: {
  block: ClickRevealWidget;
  onChange: (block: ClickRevealWidget) => void;
  onEnsureBlockSelected?: () => void;
  innerSelection?: null;
  onInnerSelectionChange?: (selection: null) => void;
}): ReactElement;
export declare function ClickRevealViewer(props: {
  block: ClickRevealWidget;
  isThumbnail?: boolean;
}): ReactElement;
export declare function ClickRevealProperties(props: {
  block: ClickRevealWidget;
  applyNow: (
    fn: (block: ClickRevealWidget) => ClickRevealWidget,
  ) => Promise<void>;
}): ReactElement;
