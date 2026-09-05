import type { ReactElement } from "react";

/** Stub de tipos para el build de element-kit (runtime = workspace). */
export interface ContadorWidget {
  tipo: "contador";
  modo: "temporizador" | "cronometro" | "numero";
  etiqueta?: string;
  segundos: number;
  valorInicial: number;
  valorPaso?: number;
  formato?: "mm:ss" | "hh:mm:ss";
  autoIniciar?: boolean;
  mostrarControles?: boolean;
  alTerminar?: "ninguna" | "siguiente";
  colorFondo?: string;
  colorTexto?: string;
  colorAcento?: string;
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  zIndex?: number;
}

export declare function createDefaultContadorBlock(): ContadorWidget;
export declare function ContadorEditor(props: {
  block: ContadorWidget;
  onEnsureBlockSelected?: () => void;
}): ReactElement;
export declare function ContadorViewer(props: {
  block: ContadorWidget;
  isThumbnail?: boolean;
}): ReactElement;
export declare function ContadorProperties(props: {
  block: ContadorWidget;
  applyNow: (fn: (block: ContadorWidget) => ContadorWidget) => Promise<void>;
}): ReactElement;
