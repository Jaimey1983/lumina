import type { ReactElement } from "react";

/** Stub de tipos para el build aislado de element-kit (runtime = workspace). */
export type GraficoChartType =
  | "bar"
  | "column"
  | "line"
  | "area"
  | "pie"
  | "donut"
  | "radialBar";

export interface GraficoSerie {
  nombre: string;
  valores: number[];
  color?: string;
}

export interface GraficoDatosBlock {
  id: string;
  tipo: "grafico";
  modo: "contenido";
  soloLecturaEnViewer: true;
  chartType: GraficoChartType;
  categorias: string[];
  series: GraficoSerie[];
  colorPaleta?: string;
  titulo?: string;
  descripcionAccesible?: string;
  mostrarLeyenda?: boolean;
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  zIndex?: number;
}

export declare function createDefaultGraficoBlock(
  partial?: Partial<GraficoDatosBlock>,
): GraficoDatosBlock;
export declare function normalizeGraficoBlock(
  input: unknown,
): GraficoDatosBlock;
export declare function GraficoEditor(props: {
  block: GraficoDatosBlock;
  isSelected?: boolean;
  onEnsureBlockSelected?: () => void;
}): ReactElement;
export declare function GraficoViewer(props: {
  block: GraficoDatosBlock;
  isThumbnail?: boolean;
}): ReactElement;
export declare function GraficoProperties(props: {
  block: GraficoDatosBlock;
  applyNow: (fn: (block: GraficoDatosBlock) => GraficoDatosBlock) => Promise<void>;
}): ReactElement;
