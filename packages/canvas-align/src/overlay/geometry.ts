// Geometría del overlay de alineación — funciones puras (probadas en node).
// El componente <AlignmentOverlay> (alignment-overlay.tsx) las consume.

import type { SnapLine } from '../snap.js';
import type { Measurement } from '../measurements.js';
import type { AlignRect } from '../obb.js';
import {
  VIRTUAL_CANVAS_WIDTH,
  VIRTUAL_CANVAS_HEIGHT,
} from '../virtual-canvas.js';

// ─── Lenguaje visual único (retira los 4 colores sueltos de hoy) ──────────────
export type AlignSemantic = 'object' | 'distribute' | 'canvas';

/**
 * Un color por semántica. Los consumidores pueden sobreescribir vía CSS var.
 *
 * `distribute` usa `#047857` (emerald-700) y no `#10B981` (emerald-500): el
 * texto blanco de las pills de cota (`Pill` en `alignment-overlay.tsx`) sobre
 * `#10B981` da ~2.6:1 de contraste — por debajo del mínimo WCAG AA (4.5:1)
 * para texto normal. `#047857` da ~5.8:1, pasa AA sin dejar de leerse como
 * "verde" (mismo rol semántico, mismo matiz, más oscuro).
 */
export const ALIGN_TOKEN: Record<AlignSemantic, { var: string; fallback: string }> = {
  object: { var: '--align-object', fallback: '#2563EB' },
  distribute: { var: '--align-distribute', fallback: '#047857' },
  canvas: { var: '--align-canvas', fallback: '#94A3B8' },
};

export function alignColor(sem: AlignSemantic): string {
  const t = ALIGN_TOKEN[sem];
  return `var(${t.var}, ${t.fallback})`;
}

export function guideSemantic(guide: SnapLine): AlignSemantic {
  if (guide.kind === 'gap') return 'distribute';
  if (guide.kind === 'grid') return 'canvas';
  return 'object';
}

export function measurementSemantic(m: Measurement): AlignSemantic {
  if (m.role === 'equal') return 'distribute';
  if (m.role === 'canvas') return 'canvas';
  return 'object';
}

// ─── Escala de z-index (documentada, sin números mágicos sueltos) ─────────────
export const Z = {
  gridOverlay: 10,
  extensionLine: 18,
  guideLine: 20,
  measurement: 22,
  badge: 24,
} as const;

// ─── Pixel-snap ──────────────────────────────────────────────────────────────
/**
 * Redondea un valor en % para que caiga en un px de dispositivo entero.
 * `spanPx` = ancho/alto del lienzo virtual en el eje; `zoom` = escala del lienzo
 * (1 overlay px = 1/zoom px de pantalla, así que se redondea a `1/zoom`).
 */
export function pixelSnapPct(pct: number, spanPx: number, zoom = 1): number {
  const z = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  const px = (pct / 100) * spanPx;
  const snapped = Math.round(px * z) / z;
  return (snapped / spanPx) * 100;
}

export function pixelSnapX(pct: number, zoom = 1): number {
  return pixelSnapPct(pct, VIRTUAL_CANVAS_WIDTH, zoom);
}
export function pixelSnapY(pct: number, zoom = 1): number {
  return pixelSnapPct(pct, VIRTUAL_CANVAS_HEIGHT, zoom);
}

// ─── Ticks perpendiculares en los bordes alineados ───────────────────────────
export interface GuideTick {
  /** posición a lo largo de la guía, en % del eje transversal. */
  at: number;
}

/**
 * Para una guía de alineación 'object', los dos extremos del solape con el
 * bloque activo — ahí van los remates en "T". Devuelve `[]` si no hay `activeRect`.
 */
export function guideTicks(
  guide: SnapLine,
  activeRect: AlignRect | null | undefined,
): GuideTick[] {
  if (!activeRect || guide.kind === 'gap' || guide.kind === 'grid') return [];
  if (guide.orientation === 'vertical') {
    return [{ at: activeRect.y }, { at: activeRect.y + activeRect.alto }];
  }
  return [{ at: activeRect.x }, { at: activeRect.x + activeRect.ancho }];
}

// ─── Líneas de extensión a objetos no solapados ──────────────────────────────
export interface ExtensionSegment {
  orientation: 'vertical' | 'horizontal';
  /** posición fija de la línea (%). */
  pos: number;
  /** inicio y fin a lo largo del eje transversal (%). */
  from: number;
  to: number;
}

/**
 * Si `peer` no solapa `active` en el eje transversal de la guía, devuelve el
 * tramo punteado que une el borde del peer con el bloque activo a lo largo de
 * la guía. `null` si solapan (entonces la guía sólida ya basta).
 */
export function extensionSegment(
  guide: SnapLine,
  activeRect: AlignRect,
  peerRect: AlignRect,
): ExtensionSegment | null {
  if (guide.kind === 'gap' || guide.kind === 'grid') return null;

  if (guide.orientation === 'vertical') {
    const aTop = activeRect.y;
    const aBot = activeRect.y + activeRect.alto;
    const pTop = peerRect.y;
    const pBot = peerRect.y + peerRect.alto;
    const overlap = aTop < pBot && aBot > pTop;
    if (overlap) return null;
    const from = aBot <= pTop ? aBot : pBot;
    const to = aBot <= pTop ? pTop : aTop;
    return { orientation: 'vertical', pos: guide.position, from, to };
  }

  const aLeft = activeRect.x;
  const aRight = activeRect.x + activeRect.ancho;
  const pLeft = peerRect.x;
  const pRight = peerRect.x + peerRect.ancho;
  const overlap = aLeft < pRight && aRight > pLeft;
  if (overlap) return null;
  const from = aRight <= pLeft ? aRight : pRight;
  const to = aRight <= pLeft ? pLeft : aLeft;
  return { orientation: 'horizontal', pos: guide.position, from, to };
}

// ─── Anticolisión de pills de cota ───────────────────────────────────────────
export interface LabelBox {
  id: string;
  /** centro de la pill, en % del lienzo. */
  cx: number;
  cy: number;
  /** medidas de la pill, en % del lienzo. */
  w: number;
  h: number;
}

/**
 * Separa pills que se solapan desplazándolas en Y (mínimo movimiento). Entrada y
 * salida en % del lienzo. Determinista: ordena por `cy` y empuja hacia abajo.
 */
export function resolveLabelCollisions(labels: LabelBox[]): LabelBox[] {
  const sorted = [...labels].sort((a, b) => a.cy - b.cy || a.cx - b.cx);
  const placed: LabelBox[] = [];
  for (const l of sorted) {
    let cy = l.cy;
    let moved = true;
    let guard = 0;
    while (moved && guard++ < 50) {
      moved = false;
      for (const p of placed) {
        const dx = Math.abs(p.cx - l.cx);
        const dy = Math.abs(p.cy - cy);
        if (dx < (p.w + l.w) / 2 && dy < (p.h + l.h) / 2) {
          cy = p.cy + (p.h + l.h) / 2 + 0.2;
          moved = true;
        }
      }
    }
    placed.push({ ...l, cy });
  }
  // devolver en el orden original
  const byId = new Map(placed.map((p) => [p.id, p]));
  return labels.map((l) => byId.get(l.id) ?? l);
}

// ─── Badge de dimensión / posición ──────────────────────────────────────────
export interface DimensionLabel {
  wPx: number;
  hPx: number;
  xPx: number;
  yPx: number;
  text: string;
}

/** `W×H` y `X,Y` del rect (en px virtuales — lo que muestra la regla). */
export function dimensionLabel(rect: AlignRect): DimensionLabel {
  const wPx = Math.round((rect.ancho / 100) * VIRTUAL_CANVAS_WIDTH);
  const hPx = Math.round((rect.alto / 100) * VIRTUAL_CANVAS_HEIGHT);
  const xPx = Math.round((rect.x / 100) * VIRTUAL_CANVAS_WIDTH);
  const yPx = Math.round((rect.y / 100) * VIRTUAL_CANVAS_HEIGHT);
  return { wPx, hPx, xPx, yPx, text: `${wPx} × ${hPx}` };
}

/** Normaliza grados a [0, 360) con 1 decimal para el badge de rotación. */
export function degreesLabel(deg: number): string {
  const n = ((deg % 360) + 360) % 360;
  return `${Math.round(n * 10) / 10}°`;
}

// ─── Anuncio de accesibilidad (aria-live) ────────────────────────────────────
/**
 * Texto corto en español para un `aria-live="polite"` que anuncie, al soltar
 * un drag/resize/rotate (o al mostrar la guía transitoria de nudge / la
 * herramienta de medición), qué alineación se logró — un lector de pantalla
 * no ve las guías ni las cotas del overlay (`aria-hidden`, es decorativo).
 * Devuelve `''` si no hay nada que anunciar (sin guías, sin cotas, sin
 * rotación) para no generar anuncios vacíos.
 */
export function describeAlignmentAnnouncement(
  guides: SnapLine[],
  measurements: Measurement[],
  rotationDeg?: number,
): string {
  const parts: string[] = [];

  const hasKind = (kind: SnapLine['kind']) => guides.some((g) => g.kind === kind);
  if (hasKind('grid')) {
    parts.push('Ajustado a la grilla');
  } else if (hasKind('gap')) {
    parts.push('Espaciado igualado');
  } else {
    const alignedVertical = guides.some(
      (g) => g.orientation === 'vertical' && (g.kind ?? 'align') === 'align',
    );
    const alignedHorizontal = guides.some(
      (g) => g.orientation === 'horizontal' && (g.kind ?? 'align') === 'align',
    );
    if (alignedVertical && alignedHorizontal) {
      parts.push('Alineado horizontal y verticalmente');
    } else if (alignedVertical) {
      parts.push('Alineado verticalmente');
    } else if (alignedHorizontal) {
      parts.push('Alineado horizontalmente');
    }
  }

  if (measurements.length > 0) {
    const closest = measurements.reduce((min, m) => (m.distance < min.distance ? m : min));
    parts.push(`Distancia: ${Math.round(closest.distance)} px`);
  }

  if (typeof rotationDeg === 'number' && rotationDeg % 360 !== 0) {
    parts.push(`Rotación: ${degreesLabel(rotationDeg)}`);
  }

  return parts.join(' · ');
}
