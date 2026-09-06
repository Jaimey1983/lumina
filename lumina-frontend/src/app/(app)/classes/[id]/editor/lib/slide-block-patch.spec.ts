import { describe, expect, it } from 'vitest';

import type { Block } from '@/types/slide.types';

import { applySlideBlockPatch, diffSlideBlocks } from './slide-block-patch';

function texto(id: string, contenido: string, x: number): Block {
  return {
    tipo: 'texto',
    contenido,
    x,
    y: 10,
    ancho: 20,
    alto: 10,
    ...(id ? { id } : {}),
  } as Block;
}

describe('slide-block-patch', () => {
  it('guarda solo campos modificados y aplica por id estable', () => {
    const previous = [texto('a', 'uno', 10), texto('b', 'dos', 20)];
    const next = [texto('a', 'uno editado', 35), texto('b', 'dos', 20)];
    const patch = diffSlideBlocks(previous, next);

    expect(patch.operations).toEqual([
      {
        op: 'update',
        index: 0,
        blockId: 'a',
        changes: [
          { op: 'set', path: ['contenido'], value: 'uno editado' },
          { op: 'set', path: ['x'], value: 35 },
        ],
      },
    ]);
    expect(applySlideBlockPatch(previous, patch)).toEqual(next);
  });

  it('representa pegar y eliminar como splice del tramo tocado', () => {
    const a = texto('', 'a', 10);
    const b = texto('', 'b', 20);
    const pasted = texto('', 'nuevo', 30);
    const addPatch = diffSlideBlocks([a, b], [a, pasted, b]);
    expect(addPatch.operations).toEqual([
      { op: 'splice', index: 1, deleteCount: 0, blocks: [pasted] },
    ]);
    expect(applySlideBlockPatch([a, b], addPatch)).toEqual([a, pasted, b]);

    const removePatch = diffSlideBlocks([a, pasted, b], [a, b]);
    expect(removePatch.operations).toEqual([
      { op: 'splice', index: 1, deleteCount: 1, blocks: [] },
    ]);
    expect(applySlideBlockPatch([a, pasted, b], removePatch)).toEqual([a, b]);
  });

  it('preserva sin mutar los bloques ajenos al patch', () => {
    const previous = [texto('', 'a', 10), texto('', 'b', 20)];
    const next = [texto('', 'a', 10), texto('', 'b', 80)];
    const applied = applySlideBlockPatch(previous, diffSlideBlocks(previous, next));
    expect(applied).toEqual(next);
    expect(applied[0]).toBe(previous[0]);
    expect(applied[1]).not.toBe(previous[1]);
  });
});
