import type { CSSProperties } from 'react';

import type { SlideGrilla, SlideGuias } from '@lumina/types/slide';
import {
  DEFAULT_GRID_SIZE_PX,
  GRID_SIZE_PRESETS,
} from '@lumina/types/slide';

import {
  VIRTUAL_CANVAS_HEIGHT,
  VIRTUAL_CANVAS_WIDTH,
} from '@/lib/canvas-guides';

/** Normaliza el tamaño de celda al preset más cercano. */
export function normalizeGridSizePx(px: unknown): number {
  const n =
    typeof px === 'number' && Number.isFinite(px) && px > 0
      ? px
      : DEFAULT_GRID_SIZE_PX;
  return GRID_SIZE_PRESETS.reduce((best, preset) =>
    Math.abs(preset - n) < Math.abs(best - n) ? preset : best,
  );
}

/** Presets de rejilla de layout por columnas (G3). 0 = desactivada. */
export const COLUMN_GRID_PRESETS = [0, 3, 12] as const;

function normalizeColumnas(raw: unknown): number | undefined {
  const n = typeof raw === 'number' && Number.isFinite(raw) ? Math.round(raw) : 0;
  if (n <= 0) return undefined;
  return Math.min(24, Math.max(1, n));
}

export function normalizeSlideGrilla(raw?: SlideGrilla | null): SlideGrilla {
  const columnas = normalizeColumnas(raw?.columnas);
  return {
    activa: raw?.activa === true,
    tamanoPx: normalizeGridSizePx(raw?.tamanoPx),
    ...(columnas ? { columnas } : {}),
  };
}

export function parseSlideGrilla(raw: unknown): SlideGrilla | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return undefined;
  }
  const o = raw as Record<string, unknown>;
  return normalizeSlideGrilla({
    activa: o.activa === true,
    tamanoPx:
      typeof o.tamanoPx === 'number' ? o.tamanoPx : DEFAULT_GRID_SIZE_PX,
    columnas: typeof o.columnas === 'number' ? o.columnas : undefined,
  });
}

/** Posiciones (% del ancho, sin bordes 0/100) de las líneas divisorias de columnas. */
export function columnGuidesPercent(columnas: number): number[] {
  const n = normalizeColumnas(columnas);
  if (!n || n < 2) return [];
  const out: number[] = [];
  for (let i = 1; i < n; i += 1) out.push((i / n) * 100);
  return out;
}

/** Activa/desactiva la rejilla de columnas con el nº dado (0 = apaga). */
export function setSlideGrillaColumnas(
  guias: SlideGuias,
  columnas: number,
): SlideGuias {
  const grilla = normalizeSlideGrilla(guias.grilla);
  const next = normalizeColumnas(columnas);
  return {
    ...guias,
    grilla: { ...grilla, columnas: next },
  };
}

export function toggleSlideGrilla(guias: SlideGuias): SlideGuias {
  const grilla = normalizeSlideGrilla(guias.grilla);
  return {
    ...guias,
    grilla: { ...grilla, activa: !grilla.activa },
  };
}

export function setSlideGrillaSize(
  guias: SlideGuias,
  tamanoPx: number,
): SlideGuias {
  return {
    ...guias,
    grilla: {
      activa: true,
      tamanoPx: normalizeGridSizePx(tamanoPx),
    },
  };
}

/** Snap de un eje al grid más cercano (origen, centro o borde del bloque). */
export function snapAxisToGridPercent(
  raw: number,
  size: number,
  gridSizePx: number,
  axis: 'x' | 'y',
  thresholdPct: number,
): { snap: number; guide: number } | null {
  const span = axis === 'x' ? VIRTUAL_CANVAS_WIDTH : VIRTUAL_CANVAS_HEIGHT;
  const stepPct = (gridSizePx / span) * 100;
  if (stepPct <= 0 || !Number.isFinite(stepPct)) return null;

  let bestDist = thresholdPct + 1;
  let best: { snap: number; guide: number } | null = null;

  const edges: Array<{ value: number; mode: 'origin' | 'center' | 'end' }> = [
    { value: raw, mode: 'origin' },
    { value: raw + size / 2, mode: 'center' },
    { value: raw + size, mode: 'end' },
  ];

  for (const { value, mode } of edges) {
    const guide = Math.round(value / stepPct) * stepPct;
    const snap =
      mode === 'origin'
        ? guide
        : mode === 'center'
          ? guide - size / 2
          : guide - size;
    const dist = Math.abs(raw - snap);
    if (dist <= thresholdPct && dist < bestDist) {
      bestDist = dist;
      best = { snap, guide };
    }
  }

  return best;
}

/** Estilo CSS para overlay de grilla sobre el lienzo 16:9. */
export function gridOverlayStyle(tamanoPx: number): CSSProperties {
  const xStep = (tamanoPx / VIRTUAL_CANVAS_WIDTH) * 100;
  const yStep = (tamanoPx / VIRTUAL_CANVAS_HEIGHT) * 100;
  return {
    backgroundImage: `
      linear-gradient(to right, rgba(148, 163, 184, 0.4) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(148, 163, 184, 0.4) 1px, transparent 1px)
    `,
    backgroundSize: `${xStep}% ${yStep}%`,
  };
}
