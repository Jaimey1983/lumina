import type { ReactElement } from "react";
export type DiagramaSubtipo =
  | 'mapa_mental'
  | 'organigrama'
  | 'mapa_conceptual'
  | 'flujo'
  | 'cronologia'
  | 'venn';

export interface DiagramaNodo {
  id: string;
  etiqueta: string;
  cuerpo?: string;
  x: number;
  y: number;
  estilo?: Record<string, unknown>;
}

export interface DiagramaArista {
  id: string;
  desdeId: string;
  haciaId: string;
  etiqueta?: string;
  dirigida?: boolean;
}

export interface DiagramaGrafoBlock {
  id: string;
  tipo: 'diagrama';
  subtipo: Exclude<DiagramaSubtipo, 'venn'>;
  modo: 'contenido';
  soloLecturaEnViewer: true;
  titulo?: string;
  descripcionAccesible?: string;
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  zIndex?: number;
  nodos: DiagramaNodo[];
  aristas: DiagramaArista[];
  layout?: 'libre' | 'jerarquico' | 'lineal';
}

export interface DiagramaVennRegion {
  id: string;
  etiqueta?: string;
}

export interface DiagramaVennElemento {
  id: string;
  texto: string;
  /** `null` = fuera de los conjuntos. Queda desde v1 para evaluación futura. */
  regionId: string | null;
}

export interface DiagramaVennBlock {
  id: string;
  tipo: 'diagrama';
  subtipo: 'venn';
  modo: 'contenido';
  soloLecturaEnViewer: true;
  titulo?: string;
  descripcionAccesible?: string;
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  zIndex?: number;
  conjuntos: 2 | 3;
  regiones: DiagramaVennRegion[];
  elementos: DiagramaVennElemento[];
}

export type DiagramaBlock = DiagramaGrafoBlock | DiagramaVennBlock;

export declare function createDefaultMapaMentalBlock(partial?: Partial<DiagramaGrafoBlock>): DiagramaGrafoBlock;
export declare function createDefaultVennBlock(partial?: Partial<DiagramaVennBlock>): DiagramaVennBlock;
export declare function normalizeDiagramaBlock(input: unknown): DiagramaBlock;
export declare function DiagramaEditor(props: {
 block: DiagramaBlock; isSelected?: boolean; onEnsureBlockSelected?: () => void;
 onChange?: (updated: DiagramaBlock) => void;
}): ReactElement;
export declare function DiagramaViewer(props: { block: DiagramaBlock; isThumbnail?: boolean }): ReactElement;
export declare function DiagramaProperties(props: {
 block: DiagramaBlock;
 applyNow: (fn: (block: DiagramaBlock) => DiagramaBlock) => Promise<void>;
}): ReactElement;