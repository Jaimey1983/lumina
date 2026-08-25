import { describe, expect, it } from 'vitest';

import {
  OVERLAY_SLIDE_PAD_PX,
  pickOverlaySide,
  shiftOverlayToFit,
} from './overlay-auto-position';

describe('pickOverlaySide', () => {
  const roomy = {
    topSpace: 400,
    bottomSpace: 400,
    leftSpace: 400,
    rightSpace: 400,
    neededW: 280,
    neededH: 160,
    gap: 12,
  };

  it('prefiere abajo si cabe el tamaño real (O2)', () => {
    expect(pickOverlaySide(roomy)).toBe('abajo');
  });

  it('no usa 200 px fijos: un hueco de 160 no alcanza para una burbuja de 160+12', () => {
    expect(
      pickOverlaySide({
        ...roomy,
        bottomSpace: 160,
        topSpace: 400,
        neededH: 160,
        gap: 12,
      }),
    ).toBe('arriba');
  });

  it('si solo cabe a la derecha, elige derecha', () => {
    expect(
      pickOverlaySide({
        topSpace: 40,
        bottomSpace: 40,
        leftSpace: 40,
        rightSpace: 300,
        neededW: 280,
        neededH: 160,
        gap: 12,
      }),
    ).toBe('derecha');
  });

  it('si ningún lado cabe, elige el de menos desborde', () => {
    expect(
      pickOverlaySide({
        topSpace: 10,
        bottomSpace: 10,
        leftSpace: 10,
        rightSpace: 100,
        neededW: 280,
        neededH: 200,
        gap: 12,
      }),
    ).toBe('derecha');
  });
});

describe('shiftOverlayToFit', () => {
  const slide = { left: 0, top: 0, right: 800, bottom: 450 };

  it('centrada y con margen, no desplaza', () => {
    const trigger = { left: 380, top: 200, right: 420, bottom: 240 };
    const { x, y } = shiftOverlayToFit({
      side: 'abajo',
      trigger,
      bubbleW: 280,
      bubbleH: 120,
      slide,
    });
    expect(x).toBe(0);
    expect(y).toBe(0);
  });

  it('un pin pegado a la izquierda desplaza la burbuja para no salir del 16:9 (O1)', () => {
    const trigger = { left: 10, top: 200, right: 40, bottom: 230 };
    const { x, y } = shiftOverlayToFit({
      side: 'abajo',
      trigger,
      bubbleW: 280,
      bubbleH: 120,
      slide,
    });
    const cx = 25;
    const unshiftedLeft = cx - 140;
    expect(unshiftedLeft).toBeLessThan(OVERLAY_SLIDE_PAD_PX);
    expect(x).toBe(OVERLAY_SLIDE_PAD_PX - unshiftedLeft);
    expect(y).toBe(0);
  });

  it('en lado izquierdo, desplaza en Y si el pin está arriba', () => {
    const trigger = { left: 400, top: 4, right: 440, bottom: 36 };
    const { x, y } = shiftOverlayToFit({
      side: 'izquierda',
      trigger,
      bubbleW: 280,
      bubbleH: 160,
      slide,
    });
    expect(x).toBe(0);
    expect(y).toBeGreaterThan(0);
  });
});
