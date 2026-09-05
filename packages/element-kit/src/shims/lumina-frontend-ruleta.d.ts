import type { ReactElement } from "react";

/** Stub de tipos para el build de element-kit (runtime = workspace). */
export interface RuletaWidget {
  tipo: "ruleta";
  configuracion: {
    colores: string[];
    sonido: boolean;
    duracionGiro: number;
    mostrarGanador: boolean;
  };
  items: { id: string; texto: string }[];
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  zIndex?: number;
}

export declare function createDefaultRuletaWidget(): RuletaWidget;
export declare function RuletaEditor(props: {
  block: RuletaWidget;
  onEnsureBlockSelected?: () => void;
}): ReactElement;
export declare function RuletaViewer(props: { block: RuletaWidget }): ReactElement;
export declare function RuletaProperties(props: {
  block: RuletaWidget;
  applyNow: (fn: (block: RuletaWidget) => RuletaWidget) => Promise<void>;
}): ReactElement;
