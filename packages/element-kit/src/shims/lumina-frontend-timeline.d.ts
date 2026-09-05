import type { ReactElement } from "react";

/** Superficie usada por el adapter durante el build aislado; test comprueba los tipos reales. */
export interface TimelineWidget {
  tipo: "timeline";
  tituloWidget?: string;
  subtituloWidget?: string;
  instruccion?: string;
  configuracion: Record<string, unknown>;
  nodos: { id: string }[];
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  zIndex?: number;
}
export declare function createDefaultTimelineBlock(): TimelineWidget;
export declare function normalizeTimelineWidget(
  block: TimelineWidget,
): TimelineWidget;
export declare function TimelineEditor(props: {
  block: TimelineWidget;
  onChange: (block: TimelineWidget) => void;
  onEnsureBlockSelected?: () => void;
  innerSelection?: null;
  onInnerSelectionChange?: (selection: null) => void;
}): ReactElement;
export declare function TimelineViewer(props: {
  widget: TimelineWidget;
  isThumbnail?: boolean;
}): ReactElement;
export declare function TimelineProperties(props: {
  block: TimelineWidget;
  applyNow: (fn: (block: TimelineWidget) => TimelineWidget) => Promise<void>;
}): ReactElement;
