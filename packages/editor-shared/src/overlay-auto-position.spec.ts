import { describe, expect, it } from 'vitest';

import { OVERLAY_SLIDE_PAD_PX, overlayShiftVars } from './overlay-auto-position';

describe('overlayShiftVars', () => {
  it('expone el desplazamiento de la burbuja y de la flecha como variables CSS', () => {
    expect(overlayShiftVars(12, -4, -12)).toEqual({
      '--overlay-shift-x': '12px',
      '--overlay-shift-y': '-4px',
      '--overlay-arrow-shift': '-12px',
    });
  });

  it('sin desplazamiento de flecha, la flecha queda centrada (0px)', () => {
    expect(overlayShiftVars(0, 0)['--overlay-arrow-shift' as keyof ReturnType<typeof overlayShiftVars>]).toBe('0px');
  });

  it('el margen interior del slide sigue siendo de 4 px', () => {
    expect(OVERLAY_SLIDE_PAD_PX).toBe(4);
  });
});
