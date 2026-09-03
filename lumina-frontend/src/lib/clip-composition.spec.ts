import { describe, expect, it } from 'vitest';

import {
  groupBlocksIntoClipMask,
  rebaseIntoBox,
  rebaseOutOfBox,
  ungroupClipMask,
  unionBBoxPct,
} from './clip-composition';
import { getBlockPos } from '@/hooks/use-block-drag';
import type { Block } from '@/types/slide.types';

function texto(x: number, y: number, ancho: number, alto: number): Block {
  return { tipo: 'texto', contenido: 'x', x, y, ancho, alto } as Block;
}

describe('unionBBoxPct', () => {
  it('cubre todos los bloques y se recorta al lienzo', () => {
    const box = unionBBoxPct([
      { x: 10, y: 20, ancho: 20, alto: 10 },
      { x: 40, y: 15, ancho: 30, alto: 40 },
    ]);
    expect(box).toEqual({ x: 10, y: 15, ancho: 60, alto: 40 });
  });
});

describe('rebaseIntoBox / rebaseOutOfBox', () => {
  const box = { x: 20, y: 10, ancho: 40, alto: 50 };

  it('into: coords de lienzo → % relativas a la caja', () => {
    const p = getBlockPos(rebaseIntoBox(texto(40, 35, 20, 25), box));
    expect(p.x).toBeCloseTo(50); // (40-20)/40
    expect(p.y).toBeCloseTo(50); // (35-10)/50
    expect(p.ancho).toBeCloseTo(50);
    expect(p.alto).toBeCloseTo(50);
  });

  it('into∘out es la identidad', () => {
    const original = texto(33, 27, 18, 22);
    const round = rebaseOutOfBox(rebaseIntoBox(original, box), box);
    const p = getBlockPos(round);
    expect(p.x).toBeCloseTo(33);
    expect(p.y).toBeCloseTo(27);
    expect(p.ancho).toBeCloseTo(18);
    expect(p.alto).toBeCloseTo(22);
  });
});

describe('groupBlocksIntoClipMask', () => {
  const bloques = [
    texto(0, 0, 10, 10), // 0
    texto(10, 20, 20, 10), // 1
    texto(40, 15, 30, 40), // 2
  ];

  it('requiere 2+ índices válidos', () => {
    expect(groupBlocksIntoClipMask(bloques, [1], { tipo: 'rectangulo' })).toBeNull();
  });

  it('envuelve la selección en un clip-group de composición con el bbox unión', () => {
    const r = groupBlocksIntoClipMask(bloques, [1, 2], { tipo: 'circulo' })!;
    expect(r).not.toBeNull();
    expect(r.next).toHaveLength(2); // 3 - 2 + 1
    const cg = r.next[r.newIndex]!;
    expect(cg.tipo).toBe('clip-group');
    if (cg.tipo !== 'clip-group') throw new Error('tipo');
    expect(cg.clipShape.tipo).toBe('circulo');
    expect(cg.contenido.tipo).toBe('composicion');
    // bbox unión de bloques 1 y 2
    expect(getBlockPos(cg)).toEqual({ x: 10, y: 15, ancho: 60, alto: 40 });
    if (cg.contenido.tipo !== 'composicion') throw new Error('contenido');
    expect(cg.contenido.bloques).toHaveLength(2);
    // el bloque 0 (no seleccionado) sigue presente
    expect(r.next.some((b) => b.tipo === 'texto')).toBe(true);
  });

  it('el clip-group se inserta en la posición del primer índice', () => {
    const r = groupBlocksIntoClipMask(bloques, [1, 2], { tipo: 'rectangulo' })!;
    expect(r.newIndex).toBe(1);
    expect(r.next[0]!.tipo).toBe('texto'); // el bloque 0 queda antes
  });
});

describe('ungroupClipMask', () => {
  it('null si el bloque no es una composición', () => {
    expect(ungroupClipMask([texto(0, 0, 10, 10)], 0)).toBeNull();
  });

  it('round-trip group → ungroup restaura las coords de lienzo', () => {
    const bloques = [
      texto(12, 8, 15, 20),
      texto(40, 30, 25, 35),
      texto(70, 50, 10, 10),
    ];
    const grouped = groupBlocksIntoClipMask(bloques, [0, 1, 2], {
      tipo: 'rectangulo',
    })!;
    const restored = ungroupClipMask(grouped.next, grouped.newIndex)!;
    expect(restored).toHaveLength(3);
    restored.forEach((b, i) => {
      const p = getBlockPos(b);
      const o = getBlockPos(bloques[i]!);
      expect(p.x).toBeCloseTo(o.x, 3);
      expect(p.y).toBeCloseTo(o.y, 3);
      expect(p.ancho).toBeCloseTo(o.ancho, 3);
      expect(p.alto).toBeCloseTo(o.alto, 3);
    });
  });
});
