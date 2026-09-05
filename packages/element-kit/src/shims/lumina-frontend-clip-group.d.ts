import type { ReactElement, ReactNode } from "react";

export type ClipShapeKind =
  | 'rectangulo'
  | 'circulo'
  | 'elipse'
  | 'triangulo'
  | 'estrella'
  | 'hexagono'
  | 'poligono'
  | 'svg'
  | 'libre'
  | 'texto';

export interface MaskNode {
  id: string;
  point: { x: number; y: number };
  handleIn: { x: number; y: number } | null;
  handleOut: { x: number; y: number } | null;
  cornerRadius?: number;
}

export interface FreeformMaskPath {
  nodes: MaskNode[];
  closed: boolean;
}

export interface ClipShapeRect {
  tipo: 'rectangulo';
  borderRadius?: number;
}

export interface ClipShapeCircle {
  tipo: 'circulo';
}

export interface ClipShapeEllipse {
  tipo: 'elipse';
}

export interface ClipShapeTriangle {
  tipo: 'triangulo';
}

export interface ClipShapeStar {
  tipo: 'estrella';
  puntas?: number;
  radioInterno?: number;
}

export interface ClipShapeHexagon {
  tipo: 'hexagono';
}

export interface ClipShapePolygon {
  tipo: 'poligono';
  lados: number;
}

export interface ClipShapeSvg {
  tipo: 'svg';
  path: string;
}

export interface ClipShapeLibre {
  tipo: 'libre';
  path?: FreeformMaskPath;
  nodos?: unknown[];
  cerrado?: boolean;
}

export interface ClipShapeTexto {
  tipo: 'texto';
  text: string;
  fontFamily: string;
  fontWeight: number | string;
  pathData: string;
  fillRule: 'nonzero';
  aspect?: number;
  fontScale?: number;
  letterSpacing?: number;
  lineHeight?: number;
  scaleX?: number;
  scaleY?: number;
  align?: 'left' | 'center' | 'right';
}

export type ClipShape =
  | ClipShapeRect
  | ClipShapeCircle
  | ClipShapeEllipse
  | ClipShapeTriangle
  | ClipShapeStar
  | ClipShapeHexagon
  | ClipShapePolygon
  | ClipShapeSvg
  | ClipShapeLibre
  | ClipShapeTexto;

export interface ClipContentImage {
  tipo: 'imagen';
  url: string;
  alt?: string;
  offsetX?: number;
  offsetY?: number;
  escala?: number;
  ajuste?: 'cubrir' | 'contener' | 'llenar';
}

export interface ClipContentColor {
  tipo: 'color';
  valor: string;
}

export interface ClipContentGradient {
  tipo: 'gradiente';
  inicio: string;
  fin: string;
  direccion?: number;
}

export interface ClipContentComposicion {
  tipo: 'composicion';
  bloques: Block[];
  fill?: ClipCompositionFill;
}

export type ClipCompositionFill =
  | ClipContentImage
  | ClipContentColor
  | ClipContentGradient;

export type ClipContent =
  | ClipContentImage
  | ClipContentColor
  | ClipContentGradient
  | ClipContentComposicion;

export interface ClipBorder {
  color?: string;
  grosor?: number;
}

export interface ClipShadow {
  color?: string;
  blur?: number;
  offsetX?: number;
  offsetY?: number;
}

export interface ClipGroupBlock {
  tipo: 'clip-group';
  id?: string;
  clipShape: ClipShape;
  contenido: ClipContent;
  borde?: ClipBorder;
  opacidad?: number;
  sombra?: ClipShadow;
  x?: number;
  y?: number;
  ancho?: number;
  alto?: number;
  zIndex?: number;
}

export type Block = ClipGroupBlock | { tipo: string; [key: string]: unknown };

export interface RenderClipGroupProps {
  block: ClipGroupBlock;
  editorMode?: boolean;
  isSelected?: boolean;
  innerEdit?: boolean;
  onContentCommit?: (patch: Partial<ClipContentImage>) => void;
  onFillCommit?: (patch: Partial<ClipContentImage>) => void;
  onShapeCommit?: (clipShape: ClipGroupBlock['clipShape']) => void;
  onEnterInnerEdit?: () => void;
  renderComposicion?: (bloques: Block[]) => ReactNode;
}

export declare function RenderClipGroup(props: RenderClipGroupProps): ReactElement;

export declare function ClipGroupProperties(props: {
  block: ClipGroupBlock;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
  scheduleApply: (fn: (b: Block) => Block) => void;
  clearDebounce: () => void;
}): ReactElement;

export declare function createDefaultClipGroupBlock(
  clipShape: ClipShape,
  contenido?: ClipContent,
): ClipGroupBlock;

export declare function createTextClipGroupBlock(
  shape: ClipShapeTexto,
  contenido?: ClipContent,
): ClipGroupBlock;

export declare function withClipGroupContent(
  block: ClipGroupBlock,
  patch: Partial<ClipContentImage>,
): ClipGroupBlock;

export declare function createDefaultClipGroup(
  shape?: ClipShape,
  contenido?: ClipContent,
): ClipGroupBlock;
