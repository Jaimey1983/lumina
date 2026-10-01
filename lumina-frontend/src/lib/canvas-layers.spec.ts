import { DEFAULT_BLOCK_Z } from '@lumina/editor-shared/block-pos';
import { blockPosToStyle } from '@/hooks/use-block-drag';
import { describe, expect, it } from 'vitest';

import type { Block } from '@lumina/types/slide';

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

  const sinZ = (content: string): Block => ({ tipo: 'texto', contenido: content, x: 0, y: 0 });
  const orden = (bloques: Block[]) =>
    buildLayerList(bloques).map((l) => l.label).reverse(); // atrás → frente

  it('traer_frente lleva al frente y renumera 1..N', () => {
    const next = applyLayerReorderAction([texto(1, 'A'), texto(5, 'B'), texto(2, 'C')], 0, 'traer_frente');
    expect(orden(next)).toEqual(['C', 'B', 'A']);
    expect(next.map(getBlockZ)).toEqual([3, 2, 1]);
  });

  it('traer_frente funciona al primer clic con bloques sin zIndex (el primero del array)', () => {
    const bloques = [sinZ('A'), sinZ('B'), sinZ('C')];
    expect(orden(bloques)).toEqual(['A', 'B', 'C']);
    const next = applyLayerReorderAction(bloques, 0, 'traer_frente');
    expect(orden(next)).toEqual(['B', 'C', 'A']);
    expect(getBlockZ(next[0]!)).toBeGreaterThan(getBlockZ(next[2]!));
  });

  it('adelante_uno y atras_uno mueven exactamente una posición', () => {
    const bloques = [sinZ('A'), sinZ('B'), sinZ('C')];
    const adelante = applyLayerReorderAction(bloques, 0, 'adelante_uno');
    expect(orden(adelante)).toEqual(['B', 'A', 'C']);
    const atras = applyLayerReorderAction(bloques, 2, 'atras_uno');
    expect(orden(atras)).toEqual(['A', 'C', 'B']);
  });

  it('con z con huecos o empatados un nivel sigue siendo un nivel', () => {
    const bloques = [texto(1, 'A'), texto(9, 'B'), texto(9, 'C')];
    expect(orden(bloques)).toEqual(['A', 'B', 'C']);
    const next = applyLayerReorderAction(bloques, 0, 'adelante_uno');
    expect(orden(next)).toEqual(['B', 'A', 'C']);
  });

  it('enviar_atras_total no deriva a negativos y es idempotente', () => {
    const bloques = [sinZ('A'), sinZ('B'), sinZ('C')];
    const once = applyLayerReorderAction(bloques, 2, 'enviar_atras_total');
    expect(orden(once)).toEqual(['C', 'A', 'B']);
    expect(Math.min(...once.map(getBlockZ))).toBe(1);
    expect(applyLayerReorderAction(once, 2, 'enviar_atras_total')).toBe(once);
  });

  it('en los extremos la acción no cambia nada (mismo array)', () => {
    const bloques = [texto(1, 'A'), texto(2, 'B')];
    expect(applyLayerReorderAction(bloques, 1, 'traer_frente')).toBe(bloques);
    expect(applyLayerReorderAction(bloques, 1, 'adelante_uno')).toBe(bloques);
    expect(applyLayerReorderAction(bloques, 0, 'atras_uno')).toBe(bloques);
  });

  it('varios bloques: traer_frente y enviar_atras_total conservan su orden relativo', () => {
    const bloques = [sinZ('A'), sinZ('B'), sinZ('C'), sinZ('D')];
    expect(orden(applyLayerReorderAction(bloques, [0, 2], 'traer_frente'))).toEqual(['B', 'D', 'A', 'C']);
    expect(orden(applyLayerReorderAction(bloques, [1, 3], 'enviar_atras_total'))).toEqual(['B', 'D', 'A', 'C']);
  });

  it('varios bloques: un paso salta al vecino no seleccionado', () => {
    const bloques = [sinZ('A'), sinZ('B'), sinZ('C'), sinZ('D')];
    // A y B juntos suben un nivel: pasan por encima de C
    expect(orden(applyLayerReorderAction(bloques, [0, 1], 'adelante_uno'))).toEqual(['C', 'A', 'B', 'D']);
    // C y D bajan un nivel: pasan por debajo de B
    expect(orden(applyLayerReorderAction(bloques, [2, 3], 'atras_uno'))).toEqual(['A', 'C', 'D', 'B']);
  });

  it('varios bloques: los que ya están en el borde no se mueven', () => {
    const bloques = [sinZ('A'), sinZ('B'), sinZ('C')];
    expect(applyLayerReorderAction(bloques, [1, 2], 'adelante_uno')).toBe(bloques);
    expect(applyLayerReorderAction(bloques, [0, 1], 'atras_uno')).toBe(bloques);
  });

  it('un bloque fijado (canvasLocked) también se puede reordenar', () => {
    const bloques = [{ ...sinZ('A'), canvasLocked: true } as Block, sinZ('B')];
    expect(orden(applyLayerReorderAction(bloques, 0, 'traer_frente'))).toEqual(['B', 'A']);
  });

  it('índices inválidos no cambian nada', () => {
    const bloques = [sinZ('A'), sinZ('B')];
    expect(applyLayerReorderAction(bloques, [5, -1, 1.5], 'traer_frente')).toBe(bloques);
  });

  it('getBlockZ coincide con el z que usa el render (sin zIndex ⇒ default)', () => {
    expect(getBlockZ(sinZ('A'))).toBe(DEFAULT_BLOCK_Z);
    expect(blockPosToStyle(sinZ('A')).zIndex).toBe(getBlockZ(sinZ('A')));
  });

  it('getBlockLayerLabel trunca HTML de texto', () => {
    expect(getBlockLayerLabel({ tipo: 'texto', contenido: '<p>Título</p>' })).toBe(
      'Título',
    );
  });
});
