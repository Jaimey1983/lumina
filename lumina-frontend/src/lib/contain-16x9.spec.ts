import { describe, expect, it } from 'vitest';
import { contain16x9 } from './contain-16x9';

describe('contain16x9', () => {
  it('en portrait (406×726, Chrome phone) limita por el ancho', () => {
    const box = contain16x9(406, 726);
    expect(box.width).toBe(406);
    expect(box.height).toBeCloseTo(406 * 9 / 16, 5);
    expect(box.height).toBeLessThan(726);
  });

  it('en landscape bajo (726×406, tablet) limita por la altura', () => {
    const box = contain16x9(726, 406);
    expect(box.height).toBe(406);
    expect(box.width).toBeCloseTo(406 * 16 / 9, 5);
    expect(box.width).toBeLessThan(726);
  });

  it('en escritorio ancho (1561×758) limita por la altura', () => {
    const box = contain16x9(1561, 758);
    expect(box.height).toBe(758);
    expect(box.width).toBeCloseTo(758 * 16 / 9, 5);
    expect(box.width).toBeLessThanOrEqual(1561);
  });

  it('devuelve 0 si el contenedor no tiene tamaño', () => {
    expect(contain16x9(0, 100)).toEqual({ width: 0, height: 0 });
    expect(contain16x9(100, 0)).toEqual({ width: 0, height: 0 });
  });
});
