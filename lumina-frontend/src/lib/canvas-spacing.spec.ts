import { describe, expect, it } from 'vitest';

import { getEqualGapSnapTargets } from './canvas-spacing';

describe('getEqualGapSnapTargets', () => {
  it('centra el bloque entre dos vecinos alineados en X', () => {
    const peers = [
      { x: 5, y: 20, ancho: 10, alto: 20 },
      { x: 30, y: 20, ancho: 10, alto: 20 },
    ];
    const { x } = getEqualGapSnapTargets(18, 22, 8, 16, peers);
    const center = x.find((t) => t.snap > 14 && t.snap < 22);
    expect(center).toBeDefined();

    const leftPx = (5 / 100) * 1280 + (10 / 100) * 1280;
    const rightPx = (30 / 100) * 1280;
    const draggedW = (8 / 100) * 1280;
    const gap = (rightPx - leftPx - draggedW) / 2;
    const expected = ((leftPx + gap) / 1280) * 100;
    expect(center!.snap).toBeCloseTo(expected, 5);
  });

  it('replica el hueco existente a la derecha del segundo bloque', () => {
    const peers = [
      { x: 5, y: 20, ancho: 10, alto: 20 },
      { x: 20, y: 20, ancho: 10, alto: 20 },
    ];
    const { x } = getEqualGapSnapTargets(40, 22, 10, 16, peers);
    const gapPct = 5;
    const rightOfSecond = 20 + 10 + gapPct;
    const replica = x.find((t) => Math.abs(t.snap - rightOfSecond) < 1e-6);
    expect(replica).toBeDefined();
  });

  it('no propone huecos si solo hay un vecino', () => {
    const { x, y } = getEqualGapSnapTargets(40, 20, 10, 10, [
      { x: 5, y: 20, ancho: 10, alto: 20 },
    ]);
    expect(x).toEqual([]);
    expect(y).toEqual([]);
  });
});
