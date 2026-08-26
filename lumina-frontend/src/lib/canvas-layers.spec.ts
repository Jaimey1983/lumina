import { describe, expect, it } from 'vitest';

import type { Block } from '@/types/slide.types';

import {
  applyLayerReorderAction,
  buildLayerList,
  getBlockLayerLabel,
  getBlockZ,
} from './canvas-layers';

function texto(z: number, content = 'Hola'): Block {
  return { tipo: 'texto', contenido: content, x: 0, y: 0, zIndex: z };
}

describe('canvas-layers', () => {
  it('ordena capas con zIndex mayor arriba', () => {
    const list = buildLayerList([texto(1, 'A'), texto(3, 'B'), texto(2, 'C')]);
    expect(list.map((l) => l.label)).toEqual(['B', 'C', 'A']);
  });

  it('traer_frente asigna z por encima del máximo', () => {
    const bloques = [texto(1), texto(5), texto(2)];
    const next = applyLayerReorderAction(bloques, 0, 'traer_frente');
    expect(getBlockZ(next[0]!)).toBe(6);
  });

  it('getBlockLayerLabel trunca HTML de texto', () => {
    expect(getBlockLayerLabel({ tipo: 'texto', contenido: '<p>Título</p>' })).toBe(
      'Título',
    );
  });
});
