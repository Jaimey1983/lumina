import type { ReactElement } from "react";

/** Stub de tipos para el build de element-kit (runtime = workspace). */
export interface TooltipWidget {
  tipo: "tooltip";
  triggerTipo: "icono" | "texto_subrayado" | "punto";
  icono?: string;
  textoTrigger?: string;
  textoTooltip: string;
  posicion: "auto" | "arriba" | "abajo" | "izquierda" | "derecha";
  colorFondo?: string;
  colorTexto?: string;
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  zIndex?: number;
}

export declare function createDefaultTooltipBlock(): TooltipWidget;
export declare function TooltipEditor(props: {
  block: TooltipWidget;
  onEnsureBlockSelected?: () => void;
  isSelected?: boolean;
}): ReactElement;
export declare function TooltipViewer(props: {
  block: TooltipWidget;
  isThumbnail?: boolean;
}): ReactElement;
export declare function TooltipProperties(props: {
  block: TooltipWidget;
  applyNow: (fn: (block: TooltipWidget) => TooltipWidget) => Promise<void>;
}): ReactElement;
