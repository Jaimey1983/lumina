/**
 * Modelo de datos y adaptadores del contorno freeform de las máscaras de recorte.
 *
 * Paper.js es solo el motor de la experiencia de edición (ver
 * `clip-path-node-editor-paper.tsx`). Lo persistido y lo que consume el render
 * SVG normal de la plataforma es `FreeformMaskPath` — este módulo no importa
 * `paper` y es seguro en SSR / tests.
 */

import type {
  ClipPathNode,
  ClipShapeLibre,
  FreeformMaskPath,
  MaskNode,
} from '@/types/slide.types';

let maskNodeSeq = 0;

export function createMaskNodeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  maskNodeSeq += 1;
  return `mn_${Date.now()}_${maskNodeSeq}`;
}

function clampNorm(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/** Redondea a 1e-5 para no arrastrar ruido de coma flotante al JSON persistido. */
function round5(n: number): number {
  return Math.round(n * 1e5) / 1e5;
}

const HANDLE_EPS = 1e-5;

/** Devuelve la manija saneada, o `null` si es nula / no finita / de longitud ~0. */
function sanitizeHandle(
  v: { x: number; y: number } | null | undefined,
): { x: number; y: number } | null {
  if (!v || !Number.isFinite(v.x) || !Number.isFinite(v.y)) return null;
  if (Math.abs(v.x) < HANDLE_EPS && Math.abs(v.y) < HANDLE_EPS) return null;
  return { x: round5(v.x), y: round5(v.y) };
}

/** Hexágono irregular por defecto (coincide con el contorno libre histórico). */
const DEFAULT_POINTS: { x: number; y: number }[] = [
  { x: 0.5, y: 0.05 },
  { x: 0.92, y: 0.28 },
  { x: 0.92, y: 0.72 },
  { x: 0.5, y: 0.95 },
  { x: 0.08, y: 0.72 },
  { x: 0.08, y: 0.28 },
];

export function createDefaultFreeformPath(): FreeformMaskPath {
  return {
    closed: true,
    nodes: DEFAULT_POINTS.map((p) => ({
      id: createMaskNodeId(),
      point: { ...p },
      handleIn: null,
      handleOut: null,
    })),
  };
}

/** Contorno vacío para la herramienta "dibujar desde cero". */
export function createEmptyFreeformPath(): FreeformMaskPath {
  return { closed: false, nodes: [] };
}

export function normalizeMaskNode(node: MaskNode): MaskNode {
  const out: MaskNode = {
    id: node.id || createMaskNodeId(),
    point: { x: round5(clampNorm(node.point.x)), y: round5(clampNorm(node.point.y)) },
    handleIn: sanitizeHandle(node.handleIn),
    handleOut: sanitizeHandle(node.handleOut),
  };
  if (
    typeof node.cornerRadius === 'number' &&
    Number.isFinite(node.cornerRadius) &&
    node.cornerRadius > 1e-4
  ) {
    out.cornerRadius = round5(Math.min(node.cornerRadius, 1));
  }
  return out;
}

/**
 * Sanea un contorno. Una lista de nodos vacía es válida (contorno en
 * construcción con la herramienta de dibujo); solo se sustituye por el contorno
 * por defecto si `path` o `path.nodes` no existen.
 */
export function normalizeFreeformPath(
  path: FreeformMaskPath | null | undefined,
): FreeformMaskPath {
  if (!path || !Array.isArray(path.nodes)) {
    return createDefaultFreeformPath();
  }
  return {
    closed: path.closed !== false,
    nodes: path.nodes.map(normalizeMaskNode),
  };
}

/**
 * Adaptador de migración: contorno libre en el formato anterior
 * (`ClipPathNode[]` con `cpIn`/`cpOut` **absolutos** y `tipo`) →
 * `FreeformMaskPath` con manijas **relativas** al punto. El campo `tipo` se
 * descarta (el modelo nuevo solo tiene manijas independientes).
 */
export function migrateLibreNodesToFreeform(
  nodos: ClipPathNode[] | undefined,
  cerrado: boolean | undefined,
): FreeformMaskPath {
  if (!Array.isArray(nodos) || nodos.length === 0) {
    return createDefaultFreeformPath();
  }
  return {
    closed: cerrado !== false,
    nodes: nodos.map((n) => ({
      id: n.id || createMaskNodeId(),
      point: { x: round5(clampNorm(n.x)), y: round5(clampNorm(n.y)) },
      handleIn: n.cpIn
        ? sanitizeHandle({ x: n.cpIn.x - n.x, y: n.cpIn.y - n.y })
        : null,
      handleOut: n.cpOut
        ? sanitizeHandle({ x: n.cpOut.x - n.x, y: n.cpOut.y - n.y })
        : null,
    })),
  };
}

/**
 * Resuelve el contorno editable de un `ClipShapeLibre`:
 * `path` nuevo → o migración del `nodos` legado → o contorno por defecto.
 */
export function resolveFreeformPath(shape: ClipShapeLibre): FreeformMaskPath {
  if (shape.path && Array.isArray(shape.path.nodes)) {
    // Contorno nuevo (incluye el caso vacío en construcción).
    return normalizeFreeformPath(shape.path);
  }
  if (Array.isArray(shape.nodos) && shape.nodos.length > 0) {
    return migrateLibreNodesToFreeform(shape.nodos, shape.cerrado);
  }
  return createDefaultFreeformPath();
}

const fmt = (n: number): string => String(round5(n));

type Pt = { x: number; y: number };
const vSub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const vAdd = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
const vMul = (a: Pt, s: number): Pt => ({ x: a.x * s, y: a.y * s });
const vLen = (a: Pt): number => Math.hypot(a.x, a.y);
const vNorm = (a: Pt): Pt => {
  const l = vLen(a) || 1;
  return { x: a.x / l, y: a.y / l };
};

export interface CornerFillet {
  /** Distancia de recorte efectiva a cada arista (tras clamp a media arista). */
  trim: number;
  /** Punto sobre la arista prev→V donde arranca el arco. */
  a: Pt;
  /** Punto sobre la arista V→next donde termina el arco. */
  b: Pt;
  /** Controles cúbicos del arco (aprox. circular). */
  cpA: Pt;
  cpB: Pt;
  /** Bisectriz unitaria del ángulo, hacia el interior. */
  bisector: Pt;
}

/**
 * Geometría del redondeo de una esquina. `prev`/`next` son los puntos ancla
 * vecinos, `v` el vértice, `trimWanted` la distancia de recorte deseada (se
 * limita a media arista). Devuelve `null` si la esquina es casi recta, un pico
 * degenerado, las aristas son nulas o el recorte queda en ~0.
 */
export function computeCornerFillet(
  prev: Pt,
  v: Pt,
  next: Pt,
  trimWanted: number,
): CornerFillet | null {
  const e1 = vSub(prev, v);
  const e2 = vSub(next, v);
  const l1 = vLen(e1);
  const l2 = vLen(e2);
  if (l1 < 1e-6 || l2 < 1e-6) return null;

  const u1 = vMul(e1, 1 / l1);
  const u2 = vMul(e2, 1 / l2);
  const dot = Math.max(-1, Math.min(1, u1.x * u2.x + u1.y * u2.y));
  const phi = Math.acos(dot); // ángulo del vértice
  if (phi < 1e-3 || phi > Math.PI - 1e-3) return null;

  const trim = Math.min(Math.max(trimWanted, 0), Math.min(l1, l2) * 0.5);
  if (trim < 1e-6) return null;

  const beta = phi / 2;
  const rEff = trim * Math.tan(beta); // radio del círculo tangente a ambas aristas
  const k = rEff * (4 / 3) * Math.tan((Math.PI - phi) / 4); // arco → cúbica

  const a = vAdd(v, vMul(u1, trim));
  const b = vAdd(v, vMul(u2, trim));

  return {
    trim,
    a,
    b,
    cpA: vAdd(a, vMul(u1, -k)),
    cpB: vAdd(b, vMul(u2, -k)),
    bisector: vNorm(vAdd(u1, u2)),
  };
}

/** ¿El nodo `i` admite redondeo de esquina? (contorno cerrado, sin manijas,
 *  aristas incidentes rectas). */
export function cornerFilletEligible(
  nodes: MaskNode[],
  i: number,
  closed: boolean,
): boolean {
  const n = nodes.length;
  if (!closed || n < 3) return false;
  const cur = nodes[i]!;
  if (cur.handleIn || cur.handleOut) return false;
  const prev = nodes[(i - 1 + n) % n]!;
  const next = nodes[(i + 1) % n]!;
  return !prev.handleOut && !next.handleIn;
}

/**
 * Exporta el contorno a un atributo `d` de `<path>` en coords
 * `clipPathUnits="objectBoundingBox"` (0–1). Es lo que consume el render normal
 * (SVG puro, sin Paper.js). Aplica el redondeo de esquinas (`cornerRadius`).
 */
export function freeformPathToSvgD(path: FreeformMaskPath): string {
  const p = normalizeFreeformPath(path);
  const { nodes } = p;
  const n = nodes.length;
  if (n < 2) return 'M 0,0 H 1 V 1 H 0 Z';
  const closed = p.closed && n >= 3;

  const fillets: (CornerFillet | null)[] = nodes.map((node, i) => {
    const r = node.cornerRadius ?? 0;
    if (r <= 0 || !cornerFilletEligible(nodes, i, closed)) return null;
    const prev = nodes[(i - 1 + n) % n]!;
    const next = nodes[(i + 1) % n]!;
    return computeCornerFillet(prev.point, node.point, next.point, r);
  });

  const arrive = (i: number): Pt => fillets[i]?.a ?? nodes[i]!.point;
  const depart = (i: number): Pt => fillets[i]?.b ?? nodes[i]!.point;

  const edgeD = (i: number, j: number): string => {
    const a = nodes[i]!;
    const b = nodes[j]!;
    const c1 = a.handleOut;
    const c2 = b.handleIn;
    if (c1 || c2) {
      const c1x = a.point.x + (c1?.x ?? 0);
      const c1y = a.point.y + (c1?.y ?? 0);
      const c2x = b.point.x + (c2?.x ?? 0);
      const c2y = b.point.y + (c2?.y ?? 0);
      return ` C ${fmt(c1x)},${fmt(c1y)} ${fmt(c2x)},${fmt(c2y)} ${fmt(b.point.x)},${fmt(b.point.y)}`;
    }
    const to = arrive(j);
    return ` L ${fmt(to.x)},${fmt(to.y)}`;
  };

  const arcD = (i: number): string => {
    const f = fillets[i];
    if (!f) return '';
    return ` C ${fmt(f.cpA.x)},${fmt(f.cpA.y)} ${fmt(f.cpB.x)},${fmt(f.cpB.y)} ${fmt(f.b.x)},${fmt(f.b.y)}`;
  };

  if (!closed) {
    let d = `M ${fmt(nodes[0]!.point.x)},${fmt(nodes[0]!.point.y)}`;
    for (let i = 1; i < n; i += 1) d += edgeD(i - 1, i);
    return d;
  }

  const start = depart(0);
  let d = `M ${fmt(start.x)},${fmt(start.y)}`;
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n;
    const curved = !!(nodes[i]!.handleOut || nodes[j]!.handleIn);
    // La última arista recta hacia el nodo 0 sin fillet la cierra `Z` sola.
    if (!(j === 0 && !fillets[0] && !curved)) d += edgeD(i, j);
    d += arcD(j);
  }
  return `${d} Z`;
}

export function createDefaultLibreShape(): ClipShapeLibre {
  return { tipo: 'libre', path: createDefaultFreeformPath() };
}

/** Añade un nodo en el punto medio entre el último y el primero (panel). */
export function appendMaskNode(path: FreeformMaskPath): FreeformMaskPath {
  const { nodes } = path;
  const last = nodes[nodes.length - 1]?.point ?? { x: 0.5, y: 0.5 };
  const first = nodes[0]?.point ?? { x: 0.5, y: 0.5 };
  return {
    ...path,
    nodes: [
      ...nodes,
      {
        id: createMaskNodeId(),
        point: {
          x: clampNorm((last.x + first.x) / 2),
          y: clampNorm((last.y + first.y) / 2),
        },
        handleIn: null,
        handleOut: null,
      },
    ],
  };
}

/** Quita el último nodo salvo que queden 3 (mínimo para cerrar). */
export function removeLastMaskNode(path: FreeformMaskPath): FreeformMaskPath {
  if (path.nodes.length <= 3) return path;
  return { ...path, nodes: path.nodes.slice(0, -1) };
}
