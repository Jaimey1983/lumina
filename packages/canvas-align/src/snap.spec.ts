import { describe, expect, it } from 'vitest';

import type { Block } from '@lumina/types/slide';

import { snapPositionToGuides, snapThresholdPct, SNAP_THRESHOLD_PX } from './snap.js';

function texto(x: number, y: number, overrides?: Partial<Block>): Block {
  return {
    tipo: 'texto',
    contenido: 'Bloque',
    x,
    y,
    ancho: 20,
    alto: 10,
    ...overrides,
  } as Block;
}

// Portado de lumina-frontend/src/hooks/use-block-drag.spec.ts → describe('snapPositionToGuides').
describe('snapPositionToGuides — paridad', () => {
  it('imanta a una guía vertical del usuario', () => {
    const near = 25 + snapThresholdPct('x') * 0.5;
    const { x, y, lines } = snapPositionToGuides(near, 10, 10, 10, 0, [texto(80, 80)], {
      guias: { verticales: [320], horizontales: [] },
    });
    expect(x).toBeCloseTo(25);
    expect(y).toBe(10);
    expect(lines).toEqual([{ orientation: 'vertical', position: 25, kind: 'align' }]);
  });

  it('el mismo 1% imanta en Y y no en X (umbral en px, no en %)', () => {
    const miss = 50 + 1;
    const { x, lines: linesX } = snapPositionToGuides(miss, 10, 10, 10, 0, [texto(80, 80)], {
      guias: { verticales: [640], horizontales: [] },
    });
    expect(x).toBe(miss);
    expect(linesX).toEqual([]);

    const { y, lines: linesY } = snapPositionToGuides(10, miss, 10, 10, 0, [texto(80, 80)], {
      guias: { verticales: [], horizontales: [360] },
    });
    expect(y).toBeCloseTo(50);
    expect(linesY).toEqual([{ orientation: 'horizontal', position: 50, kind: 'align' }]);
  });

  it('si un par está más cerca que la guía, gana el par', () => {
    const { x, lines } = snapPositionToGuides(10.4, 20, 10, 10, 1, [texto(10, 50)], {
      guias: { verticales: [640], horizontales: [] },
    });
    expect(x).toBeCloseTo(10);
    expect(lines.some((l) => l.orientation === 'vertical' && l.position === 10)).toBe(true);
  });

  it('en empate de distancia, la guía manual gana al par', () => {
    const { x, lines } = snapPositionToGuides(40, 20, 10, 10, 1, [texto(40, 70)], {
      guias: { verticales: [512], horizontales: [] },
    });
    expect(x).toBeCloseTo(40);
    expect(lines).toContainEqual({ orientation: 'vertical', position: 40, kind: 'align' });
  });

  it('imanta a un hueco igual entre dos vecinos', () => {
    const left = texto(5, 20, { ancho: 10, alto: 20 });
    const right = texto(30, 20, { ancho: 10, alto: 20 });
    const dragged = texto(16, 22, { ancho: 8, alto: 16 });
    const leftPx = (5 / 100) * 1280 + (10 / 100) * 1280;
    const rightPx = (30 / 100) * 1280;
    const draggedW = (8 / 100) * 1280;
    const gap = (rightPx - leftPx - draggedW) / 2;
    const expected = ((leftPx + gap) / 1280) * 100;
    const { x, lines } = snapPositionToGuides(
      expected + snapThresholdPct('x') * 0.4,
      22,
      8,
      16,
      2,
      [left, right, dragged],
    );
    expect(x).toBeCloseTo(expected, 5);
    expect(lines.some((l) => l.kind === 'gap' && l.orientation === 'vertical')).toBe(true);
  });

  it('con enabled false no imanta ni pinta líneas', () => {
    const { x, y, lines } = snapPositionToGuides(26, 10, 10, 10, 0, [texto(80, 80)], {
      guias: { verticales: [320], horizontales: [] },
      enabled: false,
    });
    expect(x).toBe(26);
    expect(y).toBe(10);
    expect(lines).toEqual([]);
  });

  it('con enabled false un pin 4 % no queda en -50', () => {
    const { x, y } = snapPositionToGuides(-40, -40, 4, 4, 0, [texto(80, 80)], {
      enabled: false,
    });
    expect(x).toBe(0);
    expect(y).toBe(0);
  });

  it('imanta a la grilla cuando está activa y no hay target más cercano', () => {
    const gridSize = 40;
    const stepPct = (gridSize / 1280) * 100;
    const near = stepPct * 3 + stepPct * 0.15;
    const { x, lines } = snapPositionToGuides(near, 10, 10, 10, 0, [texto(80, 80)], {
      guias: { horizontales: [], verticales: [], grilla: { activa: true, tamanoPx: gridSize } },
    });
    expect(x).toBeCloseTo(stepPct * 3);
    expect(lines).toContainEqual({ orientation: 'vertical', position: stepPct * 3, kind: 'grid' });
  });

  it('la guía manual gana a la grilla en X si está más cerca', () => {
    const gridSize = 40;
    const guidePct = 25;
    const { x, lines } = snapPositionToGuides(guidePct + 0.2, 10, 10, 10, 0, [texto(80, 80)], {
      guias: {
        horizontales: [],
        verticales: [320],
        grilla: { activa: true, tamanoPx: gridSize },
      },
    });
    expect(x).toBeCloseTo(guidePct);
    expect(lines.some((l) => l.orientation === 'vertical' && l.kind === 'grid')).toBe(false);
  });
});

describe('snapThresholdPct — escala por zoom (nuevo en G0)', () => {
  it('zoom 1 = comportamiento de hoy', () => {
    expect(snapThresholdPct('x')).toBeCloseTo((SNAP_THRESHOLD_PX / 1280) * 100);
    expect(snapThresholdPct('x', 1)).toBeCloseTo((SNAP_THRESHOLD_PX / 1280) * 100);
  });

  it('zoom 2 estrecha el umbral a la mitad', () => {
    expect(snapThresholdPct('x', 2)).toBeCloseTo(snapThresholdPct('x') / 2);
  });

  it('a zoom 2, un target a ~6 px virtuales ya no imanta', () => {
    const t1 = snapThresholdPct('x'); // ~0.625 %
    const near = 25 + t1 * 0.8; // dentro del umbral a zoom 1, fuera a zoom 2
    const at1 = snapPositionToGuides(near, 10, 10, 10, 0, [texto(80, 80)], {
      guias: { verticales: [320], horizontales: [] },
      zoom: 1,
    });
    const at2 = snapPositionToGuides(near, 10, 10, 10, 0, [texto(80, 80)], {
      guias: { verticales: [320], horizontales: [] },
      zoom: 2,
    });
    expect(at1.x).toBeCloseTo(25);
    expect(at2.x).toBeCloseTo(near);
    expect(at2.lines).toEqual([]);
  });
});
