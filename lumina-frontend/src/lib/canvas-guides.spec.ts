import { describe, expect, it } from 'vitest';

import {
  CENTER_GUIDE_X,
  CENTER_GUIDE_Y,
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
