import type { CSSProperties } from 'react';

import { VIRTUAL_CANVAS_HEIGHT, VIRTUAL_CANVAS_WIDTH } from '@/lib/canvas-guides';

import type {
  ClipContent,
  ClipContentImage,
  ClipPathNode,
  ClipPathNodeKind,
  ClipShadow,
  ClipShape,
  ClipGroupBlock,
} from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';

export type ClipImageAjuste = NonNullable<ClipContentImage['ajuste']>;

/** Resultado de `generarClipPath`: path SVG en coords objectBoundingBox (0–1). */
export interface GeneratedClipPath {
  d: string;
}

const HANDLE_EPS = 1e-5;
const DEFAULT_HANDLE_ARM = 0.08;

let clipNodeIdCounter = 0;

export function createClipPathNodeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  clipNodeIdCounter += 1;
  return `cpn_${Date.now()}_${clipNodeIdCounter}`;
}

export function defaultClipPathNodeKind(node: ClipPathNode): ClipPathNodeKind {
  if (node.tipo) return node.tipo;
  return node.cpIn || node.cpOut ? 'smooth' : 'corner';
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function handleActive(
  handle: { x: number; y: number } | undefined,
  anchor: { x: number; y: number },
): boolean {
  if (!handle) return false;
  return dist(handle, anchor) > HANDLE_EPS;
}

/** Contorno inicial para forma libre (hexágono irregular). */
export const DEFAULT_LIBRE_NODES: ClipPathNode[] = [
  { id: 'libre-0', x: 0.5, y: 0.05, tipo: 'corner' },
  { id: 'libre-1', x: 0.92, y: 0.28, tipo: 'corner' },
  { id: 'libre-2', x: 0.92, y: 0.72, tipo: 'corner' },
  { id: 'libre-3', x: 0.5, y: 0.95, tipo: 'corner' },
  { id: 'libre-4', x: 0.08, y: 0.72, tipo: 'corner' },
  { id: 'libre-5', x: 0.08, y: 0.28, tipo: 'corner' },
];

export function clampNorm(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function normalizeClipPathNode(node: ClipPathNode): ClipPathNode {
  const out: ClipPathNode = {
    id: node.id ?? createClipPathNodeId(),
    x: clampNorm(node.x),
    y: clampNorm(node.y),
    tipo: defaultClipPathNodeKind(node),
  };
  if (node.cpIn) {
    out.cpIn = { x: clampNorm(node.cpIn.x), y: clampNorm(node.cpIn.y) };
  }
  if (node.cpOut) {
    out.cpOut = { x: clampNorm(node.cpOut.x), y: clampNorm(node.cpOut.y) };
  }
  return out;
}

export function normalizeLibreNodes(nodos: ClipPathNode[]): ClipPathNode[] {
  return nodos.map(normalizeClipPathNode);
}

function hasCurve(prev: ClipPathNode, curr: ClipPathNode): boolean {
  const prevAnchor = { x: prev.x, y: prev.y };
  const currAnchor = { x: curr.x, y: curr.y };
  return handleActive(prev.cpOut, prevAnchor) && handleActive(curr.cpIn, currAnchor);
}

/** Crea manijas alineadas a partir de vecinos (estilo Illustrator). */
export function createSmoothHandlesForNode(
  node: ClipPathNode,
  prev?: ClipPathNode,
  next?: ClipPathNode,
  arm = DEFAULT_HANDLE_ARM,
): Pick<ClipPathNode, 'cpIn' | 'cpOut' | 'tipo'> {
  const vx = (next?.x ?? node.x) - (prev?.x ?? node.x);
  const vy = (next?.y ?? node.y) - (prev?.y ?? node.y);
  const len = Math.hypot(vx, vy) || 1;
  const ux = vx / len;
  const uy = vy / len;
  return {
    cpIn: { x: clampNorm(node.x - ux * arm), y: clampNorm(node.y - uy * arm) },
    cpOut: { x: clampNorm(node.x + ux * arm), y: clampNorm(node.y + uy * arm) },
    tipo: 'symmetric',
  };
}

/** Alterna corner ↔ smooth (añade manijas al activar curva). */
export function toggleClipPathNodeKind(
  node: ClipPathNode,
  prev?: ClipPathNode,
  next?: ClipPathNode,
): ClipPathNode {
  const kind = defaultClipPathNodeKind(node);
  if (kind === 'corner') {
    return { ...node, ...createSmoothHandlesForNode(node, prev, next) };
  }
  return { ...node, tipo: 'corner' };
}

export interface ApplyHandleDragOptions {
  /** Alt/Option durante el arrastre → esquina independiente. */
  breakSymmetry?: boolean;
}

/**
 * Mueve una manija respetando corner / smooth / symmetric.
 * corner: solo la manija arrastrada; smooth: colineal; symmetric: espejo.
 */
export function applyHandleDrag(
  node: ClipPathNode,
  handle: 'cpIn' | 'cpOut',
  pos: { x: number; y: number },
  options: ApplyHandleDragOptions = {},
): ClipPathNode {
  const anchor = { x: node.x, y: node.y };
  const posN = { x: clampNorm(pos.x), y: clampNorm(pos.y) };
  const kind: ClipPathNodeKind = options.breakSymmetry
    ? 'corner'
    : defaultClipPathNodeKind(node);

  const next: ClipPathNode = {
    ...node,
    tipo: options.breakSymmetry ? 'corner' : node.tipo ?? kind,
  };

  if (handle === 'cpOut') {
    next.cpOut = posN;
    const vx = posN.x - anchor.x;
    const vy = posN.y - anchor.y;
    const vLen = Math.hypot(vx, vy) || 1;
    if (kind === 'symmetric') {
      next.cpIn = {
        x: clampNorm(anchor.x - vx),
        y: clampNorm(anchor.y - vy),
      };
    } else if (kind === 'smooth') {
      const inLen = node.cpIn ? dist(anchor, node.cpIn) : DEFAULT_HANDLE_ARM;
      next.cpIn = {
        x: clampNorm(anchor.x - (vx / vLen) * inLen),
        y: clampNorm(anchor.y - (vy / vLen) * inLen),
      };
    }
    return next;
  }

  next.cpIn = posN;
  const vx = posN.x - anchor.x;
  const vy = posN.y - anchor.y;
  const vLen = Math.hypot(vx, vy) || 1;
  if (kind === 'symmetric') {
    next.cpOut = {
      x: clampNorm(anchor.x - vx),
      y: clampNorm(anchor.y - vy),
    };
  } else if (kind === 'smooth') {
    const outLen = node.cpOut ? dist(anchor, node.cpOut) : DEFAULT_HANDLE_ARM;
    next.cpOut = {
      x: clampNorm(anchor.x - (vx / vLen) * outLen),
      y: clampNorm(anchor.y - (vy / vLen) * outLen),
    };
  }
  return next;
}

/** Mueve el ancla y arrastra las manijas con el mismo delta. */
export function applyAnchorDrag(
  node: ClipPathNode,
  pos: { x: number; y: number },
): ClipPathNode {
  const dx = pos.x - node.x;
  const dy = pos.y - node.y;
  const next: ClipPathNode = {
    ...node,
    x: clampNorm(pos.x),
    y: clampNorm(pos.y),
  };
  if (node.cpIn) {
    next.cpIn = { x: clampNorm(node.cpIn.x + dx), y: clampNorm(node.cpIn.y + dy) };
  }
  if (node.cpOut) {
    next.cpOut = { x: clampNorm(node.cpOut.x + dx), y: clampNorm(node.cpOut.y + dy) };
  }
  return next;
}

export function nodeShowsHandles(node: ClipPathNode, selected: boolean): boolean {
  if (!selected) return false;
  const anchor = { x: node.x, y: node.y };
  const kind = defaultClipPathNodeKind(node);
  if (kind === 'corner') {
    return handleActive(node.cpIn, anchor) || handleActive(node.cpOut, anchor);
  }
  return true;
}

/** Genera `d` a partir de nodos libres (segmentos L o C). */
export function librePathFromNodes(
  nodos: ClipPathNode[],
  cerrado = true,
): string {
  if (nodos.length < 2) {
    return 'M 0,0 H 1 V 1 H 0 Z';
  }
  const pts = normalizeLibreNodes(nodos);
  const first = pts[0]!;
  let d = `M ${first.x},${first.y}`;

  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]!;
    const curr = pts[i]!;
    if (hasCurve(prev, curr)) {
      d += ` C ${prev.cpOut!.x},${prev.cpOut!.y} ${curr.cpIn!.x},${curr.cpIn!.y} ${curr.x},${curr.y}`;
    } else {
      d += ` L ${curr.x},${curr.y}`;
    }
  }

  if (cerrado && pts.length >= 3) {
    const last = pts[pts.length - 1]!;
    if (hasCurve(last, first)) {
      d += ` C ${last.cpOut!.x},${last.cpOut!.y} ${first.cpIn!.x},${first.cpIn!.y} ${first.x},${first.y}`;
    } else {
      d += ' Z';
    }
  }
  return d;
}

export function createDefaultLibreShape(): ClipShape {
  return {
    tipo: 'libre',
    nodos: DEFAULT_LIBRE_NODES.map((n) => ({ ...n })),
    cerrado: true,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function regularPolygonPath(sides: number, cx = 0.5, cy = 0.5, r = 0.5): string {
  const n = clamp(Math.round(sides), 3, 24);
  const start = -Math.PI / 2;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = start + (2 * Math.PI * i) / n;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return `M ${pts[0]} L ${pts.slice(1).join(' L ')} Z`;
}

function starPath(puntas = 5, radioInterno = 0.4): string {
  const n = clamp(Math.round(puntas), 3, 12);
  const inner = clamp(radioInterno, 0.1, 0.9);
  const outerR = 0.5;
  const innerR = outerR * inner;
  const cx = 0.5;
  const cy = 0.5;
  const start = -Math.PI / 2;
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = start + (Math.PI * i) / n;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return `M ${pts[0]} L ${pts.slice(1).join(' L ')} Z`;
}

function roundedRectPath(borderRadiusPct = 0): string {
  const r = clamp(borderRadiusPct, 0, 50) / 100;
  const rx = r * 0.5;
  const ry = r * 0.5;
  if (rx <= 0 || ry <= 0) {
    return 'M 0,0 H 1 V 1 H 0 Z';
  }
  return [
    `M ${rx},0`,
    `H ${1 - rx}`,
    `A ${rx},${ry} 0 0 1 1,${ry}`,
    `V ${1 - ry}`,
    `A ${rx},${ry} 0 0 1 ${1 - rx},1`,
    `H ${rx}`,
    `A ${rx},${ry} 0 0 1 0,${1 - ry}`,
    `V ${ry}`,
    `A ${rx},${ry} 0 0 1 ${rx},0`,
    'Z',
  ].join(' ');
}

/**
 * Genera el atributo `d` de un `<path>` para `clipPathUnits="objectBoundingBox"`.
 */
export function generarClipPath(shape: ClipShape): GeneratedClipPath {
  switch (shape.tipo) {
    case 'rectangulo':
      return { d: roundedRectPath(shape.borderRadius ?? 0) };
    case 'circulo':
      return { d: 'M 0.5,0 A 0.5,0.5 0 1 1 0.499,0 Z' };
    case 'elipse':
      return { d: 'M 0.5,0 A 0.5,0.5 0 1 1 0.499,0 Z' };
    case 'triangulo':
      return { d: 'M 0.5,0 L 1,1 L 0,1 Z' };
    case 'estrella':
      return {
        d: starPath(shape.puntas ?? 5, shape.radioInterno ?? 0.4),
      };
    case 'hexagono':
      return { d: regularPolygonPath(6) };
    case 'poligono':
      return { d: regularPolygonPath(shape.lados) };
    case 'svg':
      return { d: shape.path.trim() || 'M 0,0 H 1 V 1 H 0 Z' };
    case 'libre':
      return {
        d: librePathFromNodes(shape.nodos ?? DEFAULT_LIBRE_NODES, shape.cerrado !== false),
      };
    default:
      return { d: 'M 0,0 H 1 V 1 H 0 Z' };
  }
}

export function clipShapeLabel(shape: ClipShape): string {
  switch (shape.tipo) {
    case 'rectangulo':
      return 'Rectángulo';
    case 'circulo':
      return 'Círculo';
    case 'elipse':
      return 'Elipse';
    case 'triangulo':
      return 'Triángulo';
    case 'estrella':
      return 'Estrella';
    case 'hexagono':
      return 'Hexágono';
    case 'poligono':
      return `Polígono (${shape.lados})`;
    case 'svg':
      return 'SVG personalizado';
    case 'libre':
      return `Forma libre (${shape.nodos?.length ?? 0} nodos)`;
    default:
      return 'Máscara';
  }
}

export function normalizeClipContentImage(
  content: ClipContentImage,
): Required<Pick<ClipContentImage, 'offsetX' | 'offsetY' | 'escala' | 'ajuste'>> &
  ClipContentImage {
  return {
    ...content,
    offsetX: content.offsetX ?? 0,
    offsetY: content.offsetY ?? 0,
    escala: content.escala ?? 1,
    ajuste: content.ajuste ?? 'cubrir',
  };
}

/**
 * Sombra visible con clip-path: `box-shadow` se recorta junto al contenido;
 * `filter: drop-shadow()` sigue el contorno recortado.
 */
export function formatClipDropShadow(shadow?: ClipShadow): string | undefined {
  if (!shadow) return undefined;
  const blur = shadow.blur ?? 0;
  const offsetX = shadow.offsetX ?? 0;
  const offsetY = shadow.offsetY ?? 0;
  if (!blur && !offsetX && !offsetY) return undefined;
  const color = shadow.color ?? 'rgba(0,0,0,0.25)';
  return `drop-shadow(${offsetX}px ${offsetY}px ${blur}px ${color})`;
}

/** Normaliza bbox, forma libre, contenido imagen y defaults de máscara. */
export function normalizeClipGroupBlock(block: ClipGroupBlock): ClipGroupBlock {
  let clipShape = block.clipShape;
  if (clipShape.tipo === 'libre') {
    clipShape = {
      ...clipShape,
      nodos: normalizeLibreNodes(
        clipShape.nodos?.length ? clipShape.nodos : DEFAULT_LIBRE_NODES,
      ),
      cerrado: clipShape.cerrado !== false,
    };
  }

  const contenido =
    block.contenido.tipo === 'imagen'
      ? normalizeClipContentImage(block.contenido)
      : block.contenido;

  return {
    ...block,
    clipShape,
    contenido,
    opacidad: block.opacidad ?? 100,
    ...(block.borde !== undefined
      ? {
          borde: {
            color: block.borde.color ?? '#475569',
            grosor: block.borde.grosor ?? 2,
          },
        }
      : {}),
  };
}

/** Escala base (cover/contain) sin zoom adicional del usuario. */
export function getClipContentScale(
  imgNaturalWidth: number,
  imgNaturalHeight: number,
  containerWidth: number,
  containerHeight: number,
  ajuste: ClipImageAjuste,
): number {
  if (
    !imgNaturalWidth ||
    !imgNaturalHeight ||
    !containerWidth ||
    !containerHeight ||
    ajuste === 'llenar'
  ) {
    return 1;
  }
  const scaleX = containerWidth / imgNaturalWidth;
  const scaleY = containerHeight / imgNaturalHeight;
  return ajuste === 'contener' ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);
}

/**
 * Dimensiones absolutas de la imagen dentro de la máscara (sin recortar el bitmap).
 * El recorte visual lo hace overflow + clip-path del contenedor.
 */
export function getClipImageStyle(
  imgNaturalWidth: number,
  imgNaturalHeight: number,
  containerWidth: number,
  containerHeight: number,
  escala: number,
  offsetXPct: number,
  offsetYPct: number,
  ajuste: ClipImageAjuste,
  extras?: Pick<CSSProperties, 'pointerEvents' | 'cursor' | 'userSelect'>,
): CSSProperties {
  const baseExtras: CSSProperties = {
    display: 'block',
    pointerEvents: extras?.pointerEvents ?? 'none',
    userSelect: extras?.userSelect ?? 'none',
    cursor: extras?.cursor,
  };

  if (!containerWidth || !containerHeight) {
    return {
      ...baseExtras,
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    };
  }

  const offsetX = (offsetXPct / 100) * containerWidth;
  const offsetY = (offsetYPct / 100) * containerHeight;

  if (ajuste === 'llenar') {
    const finalWidth = containerWidth * escala;
    const finalHeight = containerHeight * escala;
    return {
      ...baseExtras,
      position: 'absolute',
      width: `${finalWidth}px`,
      height: `${finalHeight}px`,
      maxWidth: 'none',
      maxHeight: 'none',
      top: `${(containerHeight - finalHeight) / 2 + offsetY}px`,
      left: `${(containerWidth - finalWidth) / 2 + offsetX}px`,
    };
  }

  if (!imgNaturalWidth || !imgNaturalHeight) {
    return {
      ...baseExtras,
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: ajuste === 'contener' ? 'contain' : 'cover',
    };
  }

  const baseScale = getClipContentScale(
    imgNaturalWidth,
    imgNaturalHeight,
    containerWidth,
    containerHeight,
    ajuste,
  );
  const finalWidth = imgNaturalWidth * baseScale * escala;
  const finalHeight = imgNaturalHeight * baseScale * escala;

  return {
    ...baseExtras,
    position: 'absolute',
    width: `${finalWidth}px`,
    height: `${finalHeight}px`,
    maxWidth: 'none',
    maxHeight: 'none',
    top: `${(containerHeight - finalHeight) / 2 + offsetY}px`,
    left: `${(containerWidth - finalWidth) / 2 + offsetX}px`,
  };
}

/** Límite de pan en px para evitar áreas vacías dentro de la máscara. */
export function computeClipImagePanClamp(
  imgNaturalWidth: number,
  imgNaturalHeight: number,
  containerWidth: number,
  containerHeight: number,
  escala: number,
  ajuste: ClipImageAjuste,
): { maxPanX: number; maxPanY: number } {
  if (!containerWidth || !containerHeight) {
    return { maxPanX: 0, maxPanY: 0 };
  }

  if (ajuste === 'llenar') {
    const renderedW = containerWidth * escala;
    const renderedH = containerHeight * escala;
    return {
      maxPanX: Math.max(0, (renderedW - containerWidth) / 2),
      maxPanY: Math.max(0, (renderedH - containerHeight) / 2),
    };
  }

  const natW = imgNaturalWidth || containerWidth;
  const natH = imgNaturalHeight || containerHeight;
  const baseScale = getClipContentScale(natW, natH, containerWidth, containerHeight, ajuste);
  const renderedW = natW * baseScale * escala;
  const renderedH = natH * baseScale * escala;

  return {
    maxPanX: Math.max(0, (renderedW - containerWidth) / 2),
    maxPanY: Math.max(0, (renderedH - containerHeight) / 2),
  };
}

export function clampClipImageOffsetPct(
  offsetXPct: number,
  offsetYPct: number,
  containerWidth: number,
  containerHeight: number,
  maxPanX: number,
  maxPanY: number,
): { offsetX: number; offsetY: number } {
  if (!containerWidth || !containerHeight) {
    return { offsetX: offsetXPct, offsetY: offsetYPct };
  }
  const maxXPct = (maxPanX / containerWidth) * 100;
  const maxYPct = (maxPanY / containerHeight) * 100;
  return {
    offsetX: clamp(offsetXPct, -maxXPct, maxXPct),
    offsetY: clamp(offsetYPct, -maxYPct, maxYPct),
  };
}

/** Reclampa offsets de imagen según escala, ajuste y tamaño del contenedor. */
export function clampClipContentImageOffsets(
  content: ClipContentImage,
  containerWidth: number,
  containerHeight: number,
  imgNaturalWidth = 0,
  imgNaturalHeight = 0,
): Pick<ClipContentImage, 'offsetX' | 'offsetY'> {
  const img = normalizeClipContentImage(content);
  const { maxPanX, maxPanY } = computeClipImagePanClamp(
    imgNaturalWidth,
    imgNaturalHeight,
    containerWidth,
    containerHeight,
    img.escala,
    img.ajuste,
  );
  return clampClipImageOffsetPct(
    img.offsetX,
    img.offsetY,
    containerWidth,
    containerHeight,
    maxPanX,
    maxPanY,
  );
}

/** Clamp de offsets usando bbox % del bloque sobre lienzo virtual 1280×720. */
export function clampClipImageOffsetsForBlock(
  content: ClipContentImage,
  blockAnchoPct: number,
  blockAltoPct: number,
  imgNaturalWidth = 0,
  imgNaturalHeight = 0,
): Pick<ClipContentImage, 'offsetX' | 'offsetY'> {
  const containerWidth = (blockAnchoPct / 100) * VIRTUAL_CANVAS_WIDTH;
  const containerHeight = (blockAltoPct / 100) * VIRTUAL_CANVAS_HEIGHT;
  return clampClipContentImageOffsets(
    content,
    containerWidth,
    containerHeight,
    imgNaturalWidth,
    imgNaturalHeight,
  );
}

export function createDefaultClipGroupBlock(
  clipShape: ClipShape,
  contenido?: ClipContent,
): ClipGroupBlock {
  const fb = BLOCK_FALLBACKS.clipGroup;
  return {
    tipo: 'clip-group',
    id: crypto.randomUUID(),
    clipShape,
    contenido: contenido ?? { tipo: 'color', valor: '#94a3b8' },
    borde: { color: '#475569', grosor: 2 },
    opacidad: 100,
    x: fb.x,
    y: fb.y,
    ancho: fb.ancho,
    alto: fb.alto,
  };
}

export function withClipGroupContent(
  block: ClipGroupBlock,
  patch: Partial<ClipContentImage>,
): ClipGroupBlock {
  if (block.contenido.tipo !== 'imagen') return block;
  return {
    ...block,
    contenido: { ...block.contenido, ...patch },
  };
}

/** CSS background para contenido color/gradiente dentro de la máscara. */
export function clipContentBackground(content: ClipContent): string {
  switch (content.tipo) {
    case 'color':
      return content.valor;
    case 'gradiente': {
      const dir = content.direccion ?? 180;
      return `linear-gradient(${dir}deg, ${content.inicio}, ${content.fin})`;
    }
    default:
      return '#94a3b8';
  }
}
