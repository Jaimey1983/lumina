import type { DiagramaVennElemento, DiagramaVennRegion } from '@/types/slide.types';

export const VENN_REGIONS_2: DiagramaVennRegion[] = [
  { id: 'a', etiqueta: 'Solo A' },
  { id: 'b', etiqueta: 'Solo B' },
  { id: 'ab', etiqueta: 'A ∩ B' },
];

export const VENN_REGIONS_3: DiagramaVennRegion[] = [
  { id: 'a', etiqueta: 'Solo A' },
  { id: 'b', etiqueta: 'Solo B' },
  { id: 'c', etiqueta: 'Solo C' },
  { id: 'ab', etiqueta: 'A ∩ B' },
  { id: 'ac', etiqueta: 'A ∩ C' },
  { id: 'bc', etiqueta: 'B ∩ C' },
  { id: 'abc', etiqueta: 'A ∩ B ∩ C' },
];

export interface VennCircle {
  id: 'A' | 'B' | 'C';
  cx: number;
  cy: number;
  r: number;
  fill: string;
}

/** viewBox 0 0 100 100 */
export function vennCircles(conjuntos: 2 | 3): VennCircle[] {
  if (conjuntos === 2) {
    return [
      { id: 'A', cx: 38, cy: 48, r: 28, fill: 'rgba(37, 99, 235, 0.22)' },
      { id: 'B', cx: 62, cy: 48, r: 28, fill: 'rgba(16, 185, 129, 0.22)' },
    ];
  }
  return [
    { id: 'A', cx: 38, cy: 38, r: 26, fill: 'rgba(37, 99, 235, 0.2)' },
    { id: 'B', cx: 62, cy: 38, r: 26, fill: 'rgba(16, 185, 129, 0.2)' },
    { id: 'C', cx: 50, cy: 62, r: 26, fill: 'rgba(245, 158, 11, 0.22)' },
  ];
}

export function regionesForConjuntos(conjuntos: 2 | 3): DiagramaVennRegion[] {
  return (conjuntos === 3 ? VENN_REGIONS_3 : VENN_REGIONS_2).map((r) => ({ ...r }));
}

function inCircle(x: number, y: number, c: VennCircle): boolean {
  const dx = x - c.cx;
  const dy = y - c.cy;
  return dx * dx + dy * dy <= c.r * c.r;
}

/** Coordenadas en el viewBox 0–100. `null` = fuera de los conjuntos. */
export function regionAtPoint(x: number, y: number, conjuntos: 2 | 3): string | null {
  const circles = vennCircles(conjuntos);
  const a = circles.find((c) => c.id === 'A');
  const b = circles.find((c) => c.id === 'B');
  const c = circles.find((c) => c.id === 'C');
  const inA = a ? inCircle(x, y, a) : false;
  const inB = b ? inCircle(x, y, b) : false;
  const inC = c ? inCircle(x, y, c) : false;

  if (conjuntos === 3) {
    if (inA && inB && inC) return 'abc';
    if (inA && inB) return 'ab';
    if (inA && inC) return 'ac';
    if (inB && inC) return 'bc';
    if (inA) return 'a';
    if (inB) return 'b';
    if (inC) return 'c';
    return null;
  }

  if (inA && inB) return 'ab';
  if (inA) return 'a';
  if (inB) return 'b';
  return null;
}

const CENTROIDS_2: Record<string, { x: number; y: number }> = {
  a: { x: 26, y: 48 },
  b: { x: 74, y: 48 },
  ab: { x: 50, y: 48 },
};

const CENTROIDS_3: Record<string, { x: number; y: number }> = {
  a: { x: 26, y: 32 },
  b: { x: 74, y: 32 },
  c: { x: 50, y: 78 },
  ab: { x: 50, y: 28 },
  ac: { x: 34, y: 56 },
  bc: { x: 66, y: 56 },
  abc: { x: 50, y: 48 },
};

export function regionCentroid(
  regionId: string,
  conjuntos: 2 | 3,
): { x: number; y: number } {
  const map = conjuntos === 3 ? CENTROIDS_3 : CENTROIDS_2;
  return map[regionId] ?? { x: 50, y: 50 };
}

export function assignElementoRegion(
  elementos: DiagramaVennElemento[],
  elementoId: string,
  regionId: string | null,
): DiagramaVennElemento[] {
  return elementos.map((el) => (el.id === elementoId ? { ...el, regionId } : el));
}

export function validRegionIds(conjuntos: 2 | 3): Set<string> {
  return new Set(regionesForConjuntos(conjuntos).map((r) => r.id));
}
