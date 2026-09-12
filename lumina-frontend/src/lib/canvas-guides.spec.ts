import { describe, expect, it } from 'vitest';

import {
  CENTER_GUIDE_X,
  CENTER_GUIDE_Y,
  VIRTUAL_CANVAS_HEIGHT,
  VIRTUAL_CANVAS_WIDTH,
  addGuide,
  addGuides,
  clearAllGuides,
  percentToVirtualX,
  percentToVirtualY,
  toggleCenterGuides,
} from './canvas-guides';

describe('toggleCenterGuides', () => {
  it('añade las dos guías centrales si faltan', () => {
    const next = toggleCenterGuides({ horizontales: [], verticales: [] });
    expect(next.verticales).toContain(CENTER_GUIDE_X);
    expect(next.horizontales).toContain(CENTER_GUIDE_Y);
  });

  it('completa la guía que falta', () => {
    const next = toggleCenterGuides({
      horizontales: [CENTER_GUIDE_Y],
      verticales: [],
    });
    expect(next.verticales).toEqual([CENTER_GUIDE_X]);
    expect(next.horizontales).toEqual([CENTER_GUIDE_Y]);
  });

  it('quita ambas si ya están', () => {
    const next = toggleCenterGuides({
      horizontales: [100, CENTER_GUIDE_Y],
      verticales: [CENTER_GUIDE_X, 200],
    });
    expect(next.horizontales).toEqual([100]);
    expect(next.verticales).toEqual([200]);
  });
});

describe('percentToVirtualX / percentToVirtualY', () => {
  it('es la inversa de virtualXToPercent / virtualYToPercent', () => {
    expect(percentToVirtualX(50)).toBe(VIRTUAL_CANVAS_WIDTH / 2);
    expect(percentToVirtualY(50)).toBe(VIRTUAL_CANVAS_HEIGHT / 2);
  });

  it('clampea fuera de rango', () => {
    expect(percentToVirtualX(-10)).toBe(0);
    expect(percentToVirtualX(200)).toBe(VIRTUAL_CANVAS_WIDTH);
  });
});

describe('addGuide / addGuides', () => {
  it('añade una guía nueva al eje correspondiente', () => {
    const next = addGuide({ horizontales: [], verticales: [] }, 'vertical', 300);
    expect(next.verticales).toEqual([300]);
    expect(next.horizontales).toEqual([]);
  });

  it('no duplica una guía ya existente', () => {
    const next = addGuide({ horizontales: [], verticales: [300] }, 'vertical', 300);
    expect(next.verticales).toEqual([300]);
  });

  it('addGuides aplica varias guías en una pasada, ordenadas y sin duplicar', () => {
    const next = addGuides(
      { horizontales: [], verticales: [100] },
      [
        { eje: 'vertical', valorPx: 50 },
        { eje: 'vertical', valorPx: 100 },
        { eje: 'horizontal', valorPx: 200 },
      ],
    );
    expect(next.verticales).toEqual([50, 100]);
    expect(next.horizontales).toEqual([200]);
  });
});

describe('clearAllGuides', () => {
  it('borra horizontales/verticales pero conserva la grilla', () => {
    const grilla = { activa: true, tamanoPx: 40 };
    const next = clearAllGuides({ horizontales: [100], verticales: [200], grilla });
    expect(next.horizontales).toEqual([]);
    expect(next.verticales).toEqual([]);
    expect(next.grilla).toEqual(grilla);
  });
});
