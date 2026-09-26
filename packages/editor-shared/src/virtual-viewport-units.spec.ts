import { describe, expect, it } from 'vitest';

import {
  CLICK_REVEAL_TRIGGER_LABEL_FONT_PX,
  CLICK_REVEAL_TRIGGER_TITLE_FONT_PX,
  TEXT_EMPTY_PLACEHOLDER_FONT_PX,
  TIMELINE_PROYECTO_NUM_FONT_PX,
  virtualClampPx,
  virtualPxFromVh,
  virtualPxFromVw,
} from './virtual-viewport-units';

describe('virtual-viewport-units (G-scale.3)', () => {
  it('convierte vw/vh respecto al lienzo 1280×720', () => {
    expect(virtualPxFromVw(1.6)).toBeCloseTo(20.48, 2);
    expect(virtualPxFromVw(4)).toBeCloseTo(51.2, 2);
    expect(virtualPxFromVh(1.6)).toBeCloseTo(11.52, 2);
    expect(virtualPxFromVh(2.5)).toBeCloseTo(18, 2);
  });

  it('evalúa clamps legacy en px virtual', () => {
    expect(
      virtualClampPx({ minPx: 10, vw: 1.6, maxPx: 13 }),
    ).toBe(13);
    expect(
      virtualClampPx({ minPx: 11, vh: 1.6, maxPx: 15 }),
    ).toBe(11.5);
    expect(
      virtualClampPx({ minPx: 14, vh: 2.5, maxPx: 20 }),
    ).toBe(18);
    expect(
      virtualClampPx({ minPx: 28, vw: 4, maxPx: 40 }),
    ).toBe(40);
  });

  it('expone tokens G-scale.3 estables', () => {
    expect(TEXT_EMPTY_PLACEHOLDER_FONT_PX).toBe(13);
    expect(CLICK_REVEAL_TRIGGER_TITLE_FONT_PX).toBe(11.5);
    expect(CLICK_REVEAL_TRIGGER_LABEL_FONT_PX).toBe(18);
    expect(TIMELINE_PROYECTO_NUM_FONT_PX).toBe(40);
  });
});
