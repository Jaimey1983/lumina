import type { ReactElement } from "react";

/** Superficie usada por el adapter durante el build aislado; test comprueba los tipos reales. */
export interface TabsWidget {
  tipo: "tabs";
  tituloWidget?: string;
  subtituloWidget?: string;
  instruccion?: string;
  configuracion: Record<string, unknown>;
  fichas: { id: string }[];
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  zIndex?: number;
}
export declare function createDefaultTabsBlock(): TabsWidget;
export declare function normalizeTabsWidget(block: TabsWidget): TabsWidget;
export declare function TabsEditor(props: {
  block: TabsWidget;
  onChange: (block: TabsWidget) => void;
  onEnsureBlockSelected?: () => void;
  innerSelection?: null;
  onInnerSelectionChange?: (selection: null) => void;
}): ReactElement;
export declare function TabsViewer(props: {
  block: TabsWidget;
  isThumbnail?: boolean;
}): ReactElement;
export declare function TabsProperties(props: {
  block: TabsWidget;
  applyNow: (fn: (block: TabsWidget) => TabsWidget) => Promise<void>;
}): ReactElement;
