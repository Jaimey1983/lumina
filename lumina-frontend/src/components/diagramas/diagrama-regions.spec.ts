import { describe, expect, it } from 'vitest';

import type { DiagramaVennElemento } from '@/types/slide.types';

import {
  assignElementoRegion,
  regionAtPoint,
  regionesForConjuntos,
  vennCircles,
} from './diagrama-regions';

describe('diagrama-regions', () => {
  it('clasifica A, B, intersección y fuera en 2 conjuntos', () => {
    const [a, b] = vennCircles(2);
    expect(a && b).toBeTruthy();
    expect(regionAtPoint(a!.cx - 12, a!.cy, 2)).toBe('a');
    expect(regionAtPoint(b!.cx + 12, b!.cy, 2)).toBe('b');
    expect(regionAtPoint(50, 48, 2)).toBe('ab');
    expect(regionAtPoint(6, 6, 2)).toBeNull();
  });

  it('assignElementoRegion no muta el array original', () => {
    const original: DiagramaVennElemento[] = [
      { id: 'el-1', texto: 'Pez', regionId: null },
      { id: 'el-2', texto: 'Perro', regionId: 'a' },
    ];
    const snapshot = original.map((el) => ({ ...el }));

    const next = assignElementoRegion(original, 'el-1', 'ab');

    expect(next).not.toBe(original);
    expect(original).toEqual(snapshot);
    expect(next.find((el) => el.id === 'el-1')?.regionId).toBe('ab');
    expect(next.find((el) => el.id === 'el-2')?.regionId).toBe('a');
  });

  it('regionesForConjuntos expone el catálogo 2 y 3', () => {
    expect(regionesForConjuntos(2).map((r) => r.id)).toEqual(['a', 'b', 'ab']);
    expect(regionesForConjuntos(3).map((r) => r.id)).toEqual([
      'a',
      'b',
      'c',
      'ab',
      'ac',
      'bc',
      'abc',
    ]);
  });
});
