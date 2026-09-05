import type { ReactElement } from "react";

/** Stub de tipos para el build de element-kit (runtime = workspace). */
export interface ProgresoWidget {
  tipo: "progreso";
  modo: "manual" | "slides";
  porcentaje: number;
  etiqueta?: string;
  mostrarPorcentaje?: boolean;
  striped?: boolean;
  animated?: boolean;
  colorBarra?: string;
  colorFondo?: string;
  colorTexto?: string;
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  zIndex?: number;
}

export declare function createDefaultProgresoBlock(): ProgresoWidget;
export declare function ProgresoEditor(props: {
  block: ProgresoWidget;
  onEnsureBlockSelected?: () => void;
}): ReactElement;
export declare function ProgresoViewer(props: {
  block: ProgresoWidget;
  isThumbnail?: boolean;
}): ReactElement;
export declare function ProgresoProperties(props: {
  block: ProgresoWidget;
  applyNow: (fn: (block: ProgresoWidget) => ProgresoWidget) => Promise<void>;
}): ReactElement;
