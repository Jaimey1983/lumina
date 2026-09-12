import { describe, expect, it } from 'vitest';

import {
  computeAlignToKey,
  computeExactSpacing,
  computeMatchSize,
  computeTidy,
  type OrganizeItem,
} from './organize-actions';

const item = (id: string, x: number, y: number, ancho: number, alto: number): OrganizeItem => ({
  id,
  pos: { x, y, ancho, alto },
});

describe('computeMatchSize', () => {
  const items = [item('key', 10, 10, 20, 30), item('a', 40, 40, 5, 5), item('b', 60, 60, 8, 8)];

  it('iguala el ancho de los demás al del objeto clave', () => {
    const patches = computeMatchSize(items, 'key', 'width');
    expect(patches.get('a')).toEqual({ x: 40, y: 40, ancho: 20, alto: 5 });
    expect(patches.get('b')).toEqual({ x: 60, y: 60, ancho: 20, alto: 8 });
    expect(patches.has('key')).toBe(false);
  });

  it('iguala el alto de los demás al del objeto clave', () => {
    const patches = computeMatchSize(items, 'key', 'height');
    expect(patches.get('a')).toEqual({ x: 40, y: 40, ancho: 5, alto: 30 });
  });

  it('iguala ancho y alto', () => {
    const patches = computeMatchSize(items, 'key', 'both');
    expect(patches.get('a')).toEqual({ x: 40, y: 40, ancho: 20, alto: 30 });
  });

  it('devuelve vacío si el objeto clave no está en la lista', () => {
    expect(computeMatchSize(items, 'nope', 'both').size).toBe(0);
  });
});

describe('computeExactSpacing', () => {
  it('fija el hueco horizontal entre bloques consecutivos, ordenados por x', () => {
    const items = [item('a', 0, 0, 10, 10), item('b', 30, 0, 10, 10), item('c', 60, 0, 10, 10)];
    const patches = computeExactSpacing(items, 'horizontal', 5);
    // a queda fijo (10-0=10 de ancho, borde derecho en x=10)
    expect(patches.has('a')).toBe(false);
    expect(patches.get('b')).toEqual({ x: 15, y: 0, ancho: 10, alto: 10 });
    expect(patches.get('c')).toEqual({ x: 30, y: 0, ancho: 10, alto: 10 });
  });

  it('fija el hueco vertical entre bloques consecutivos, ordenados por y', () => {
    const items = [item('a', 0, 0, 10, 10), item('b', 0, 30, 10, 10)];
    const patches = computeExactSpacing(items, 'vertical', 5);
    expect(patches.get('b')).toEqual({ x: 0, y: 15, ancho: 10, alto: 10 });
  });

  it('no hace nada con menos de 2 bloques', () => {
    expect(computeExactSpacing([item('a', 0, 0, 10, 10)], 'horizontal', 5).size).toBe(0);
  });

  it('respeta el orden por posición, no el orden de entrada', () => {
    const items = [item('c', 60, 0, 10, 10), item('a', 0, 0, 10, 10), item('b', 30, 0, 10, 10)];
    const patches = computeExactSpacing(items, 'horizontal', 5);
    expect(patches.has('a')).toBe(false);
    expect(patches.get('b')!.x).toBe(15);
    expect(patches.get('c')!.x).toBe(30);
  });
});

describe('computeTidy', () => {
  it('deja fijos los extremos y espacia el medio con huecos borde-a-borde iguales', () => {
    // a: 0-10, b: 40-45 (ancho 5), c: 90-100 → span total 100, ancho total 25,
    // 2 huecos → 37.5 cada uno.
    const items = [item('a', 0, 0, 10, 10), item('b', 40, 0, 5, 10), item('c', 90, 0, 10, 10)];
    const patches = computeTidy(items, 'horizontal');
    expect(patches.has('a')).toBe(false);
    expect(patches.has('c')).toBe(false);
    const b = patches.get('b')!;
    expect(b.x).toBeCloseTo(47.5, 5);
    expect(b.y).toBe(0);
    expect(b.ancho).toBe(5);
  });

  it('produce huecos idénticos entre todos los pares consecutivos', () => {
    const items = [
      item('a', 0, 0, 10, 10),
      item('b', 20, 0, 15, 10),
      item('c', 55, 0, 5, 10),
      item('d', 90, 0, 10, 10),
    ];
    const patches = computeTidy(items, 'horizontal');
    const bx = patches.get('b')!.x;
    const cx = patches.get('c')!.x;
    const gap1 = bx - (0 + 10);
    const gap2 = cx - (bx + 15);
    const gap3 = 90 - (cx + 5);
    expect(gap1).toBeCloseTo(gap2, 5);
    expect(gap2).toBeCloseTo(gap3, 5);
  });

  it('no hace nada con menos de 3 bloques', () => {
    const items = [item('a', 0, 0, 10, 10), item('b', 50, 0, 10, 10)];
    expect(computeTidy(items, 'horizontal').size).toBe(0);
  });

  it('no hace nada (no-op) si los bloques no entran sin solaparse', () => {
    // a: 0-10, b: 15-30 (ancho 15), c: 20-30 → suma de anchos (10+15+10=35) >
    // span total (30) → no hay hueco no-negativo posible.
    const items = [item('a', 0, 0, 10, 10), item('b', 15, 0, 15, 10), item('c', 20, 0, 10, 10)];
    expect(computeTidy(items, 'horizontal').size).toBe(0);
  });
});

describe('computeAlignToKey', () => {
  const items = [item('key', 40, 40, 20, 10), item('a', 0, 0, 8, 4)];

  it('align_left usa el borde izquierdo del objeto clave', () => {
    expect(computeAlignToKey(items, 'key', 'align_left').get('a')).toEqual({
      x: 40,
      y: 0,
      ancho: 8,
      alto: 4,
    });
  });

  it('align_center_h centra contra el objeto clave', () => {
    const patch = computeAlignToKey(items, 'key', 'align_center_h').get('a')!;
    expect(patch.x).toBeCloseTo(40 + (20 - 8) / 2, 5);
  });

  it('align_right usa el borde derecho del objeto clave', () => {
    const patch = computeAlignToKey(items, 'key', 'align_right').get('a')!;
    expect(patch.x).toBeCloseTo(40 + 20 - 8, 5);
  });

  it('align_top/center_v/bottom operan en Y de la misma forma', () => {
    expect(computeAlignToKey(items, 'key', 'align_top').get('a')!.y).toBe(40);
    expect(computeAlignToKey(items, 'key', 'align_bottom').get('a')!.y).toBeCloseTo(46, 5);
  });

  it('nunca incluye al objeto clave en el resultado', () => {
    expect(computeAlignToKey(items, 'key', 'align_left').has('key')).toBe(false);
  });
});
