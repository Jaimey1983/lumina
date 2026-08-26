import type { CSSProperties } from 'react';

import type { SlideGrilla, SlideGuias } from '@/types/slide.types';
import {
  DEFAULT_GRID_SIZE_PX,
  GRID_SIZE_PRESETS,
} from '@/types/slide.types';

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

export function normalizeSlideGrilla(raw?: SlideGrilla | null): SlideGrilla {
  return {
    activa: raw?.activa === true,
    tamanoPx: normalizeGridSizePx(raw?.tamanoPx),
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
  });
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
