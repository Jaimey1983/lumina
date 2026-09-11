import { describe, expect, it } from 'vitest';

import { aabbOfRotatedRect } from './obb.js';

describe('aabbOfRotatedRect', () => {
  it('0° devuelve una copia idéntica', () => {
    const r = { x: 10, y: 20, ancho: 30, alto: 15 };
    expect(aabbOfRotatedRect(r, 0)).toEqual(r);
    expect(aabbOfRotatedRect(r)).toEqual(r);
    expect(aabbOfRotatedRect(r, 360)).toEqual(r);
  });

  it('90° intercambia ancho/alto en px y conserva el centro', () => {
    // rect 20%×20% del lienzo → 256 px × 144 px; centro en (50%, 50%).
    const r = { x: 40, y: 40, ancho: 20, alto: 20 };
    const a = aabbOfRotatedRect(r, 90);
    // en px: 144 × 256 → en % del lienzo: 11.25 % × 35.55 %
    expect(a.ancho).toBeCloseTo((144 / 1280) * 100, 4);
    expect(a.alto).toBeCloseTo((256 / 720) * 100, 4);
    expect(a.x + a.ancho / 2).toBeCloseTo(50, 4);
    expect(a.y + a.alto / 2).toBeCloseTo(50, 4);
  });

  it('45° crece la caja y no la achica', () => {
    const r = { x: 45, y: 45, ancho: 10, alto: 10 };
    const a = aabbOfRotatedRect(r, 45);
    expect(a.ancho).toBeGreaterThan(r.ancho);
    expect(a.alto).toBeGreaterThan(r.alto);
    expect(a.x + a.ancho / 2).toBeCloseTo(50, 4);
    expect(a.y + a.alto / 2).toBeCloseTo(50, 4);
  });
});
