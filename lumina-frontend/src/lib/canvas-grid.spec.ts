import { describe, expect, it } from 'vitest';

import {
  normalizeGridSizePx,
  normalizeSlideGrilla,
  parseSlideGrilla,
  setSlideGrillaSize,
  snapAxisToGridPercent,
  toggleSlideGrilla,
} from '@/lib/canvas-grid';
import { EMPTY_SLIDE_GUIAS } from '@/types/slide.types';
import { VIRTUAL_CANVAS_WIDTH } from '@/lib/canvas-guides';

describe('normalizeGridSizePx', () => {
  it('redondea al preset más cercano', () => {
    expect(normalizeGridSizePx(38)).toBe(40);
    expect(normalizeGridSizePx(30)).toBe(32);
    expect(normalizeGridSizePx(40)).toBe(40);
  });

  it('usa default con valores inválidos', () => {
    expect(normalizeGridSizePx(undefined)).toBe(40);
    expect(normalizeGridSizePx(-5)).toBe(40);
  });
});

describe('normalizeSlideGrilla', () => {
  it('desactiva por defecto', () => {
    expect(normalizeSlideGrilla(undefined)).toEqual({ activa: false, tamanoPx: 40 });
  });

  it('preserva activa y normaliza tamaño', () => {
    expect(normalizeSlideGrilla({ activa: true, tamanoPx: 18 })).toEqual({
      activa: true,
      tamanoPx: 16,
    });
  });
});

describe('parseSlideGrilla', () => {
  it('devuelve undefined con raw inválido', () => {
    expect(parseSlideGrilla(null)).toBeUndefined();
    expect(parseSlideGrilla([])).toBeUndefined();
  });

  it('parsea objeto válido', () => {
    expect(parseSlideGrilla({ activa: true, tamanoPx: 64 })).toEqual({
      activa: true,
      tamanoPx: 64,
    });
  });
});

describe('toggleSlideGrilla / setSlideGrillaSize', () => {
  it('alterna activa conservando guías manuales', () => {
    const guias = {
      horizontales: [100],
      verticales: [200],
      grilla: { activa: false, tamanoPx: 32 },
    };
    expect(toggleSlideGrilla(guias)).toEqual({
      horizontales: [100],
      verticales: [200],
      grilla: { activa: true, tamanoPx: 32 },
    });
  });

  it('setSlideGrillaSize activa y fija tamaño', () => {
    const next = setSlideGrillaSize(EMPTY_SLIDE_GUIAS, 80);
    expect(next.grilla).toEqual({ activa: true, tamanoPx: 80 });
  });
});

describe('snapAxisToGridPercent', () => {
  const stepPct40 = (40 / VIRTUAL_CANVAS_WIDTH) * 100;

  it('imanta el origen a la celda más cercana', () => {
    const raw = stepPct40 * 2 + stepPct40 * 0.2;
    const hit = snapAxisToGridPercent(raw, 10, 40, 'x', stepPct40 * 0.5);
    expect(hit).not.toBeNull();
    expect(hit!.snap).toBeCloseTo(stepPct40 * 2);
    expect(hit!.guide).toBeCloseTo(stepPct40 * 2);
  });

  it('devuelve null fuera del umbral (solo origen)', () => {
    const raw = stepPct40 * 2 + stepPct40 * 0.6;
    const hit = snapAxisToGridPercent(raw, 0.1, 40, 'x', stepPct40 * 0.3);
    expect(hit).toBeNull();
  });
});
