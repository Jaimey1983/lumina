import { describe, expect, it } from 'vitest';
import {
  computeDagreLayout,
  type GraphEdge,
  type GraphNode,
} from '@lumina/editor-shared/graph-editor';
import type { DiagramaArista, DiagramaGrafoBlock, DiagramaNodo } from '@lumina/types/slide';

import { aplicarDagre } from './diagrama-dagre.js';
import {
  createDefaultFlujoBlock,
  createDefaultMapaConceptualBlock,
  createDefaultOrganigramaBlock,
} from './diagrama-defaults.js';

/** Copia literal del bloque que había inline en `diagrama-properties.tsx` (3 veces) antes de V1.3. */
function referenciaInline(nodos: DiagramaNodo[], aristas: DiagramaArista[]): DiagramaNodo[] {
  const graphNodes: GraphNode[] = nodos.map((n) => ({
    id: n.id,
    x: n.x,
    y: n.y,
    label: n.etiqueta,
    body: n.cuerpo,
    accent: (n.estilo?.color as string) ?? '#2563EB',
  }));
  const graphEdges: GraphEdge[] = aristas.map((a) => ({
    id: a.id,
    source: a.desdeId,
    target: a.haciaId,
  }));
  const laidOut = computeDagreLayout(graphNodes, graphEdges, { direction: 'TB' });
  const posMap = new Map(laidOut.map((l) => [l.id, l]));
  return nodos.map((n) => {
    const p = posMap.get(n.id);
    return p ? { ...n, x: p.x, y: p.y } : n;
  });
}

describe('aplicarDagre (V1.3)', () => {
  it.each([
    ['flujo', createDefaultFlujoBlock],
    ['organigrama', createDefaultOrganigramaBlock],
    ['mapa_conceptual', createDefaultMapaConceptualBlock],
  ])('da las mismas posiciones que el bloque inline anterior (%s)', (_n, crear) => {
    const block = crear({ id: 'b-dagre' }) as DiagramaGrafoBlock;
    // Posiciones desordenadas para que el layout tenga trabajo que hacer.
    const revuelto = block.nodos.map((n, i) => ({ ...n, x: (i * 37) % 11, y: (i * 53) % 7 }));

    expect(aplicarDagre(revuelto, block.aristas)).toEqual(referenciaInline(revuelto, block.aristas));
  });

  it('conserva el orden y el resto de campos de cada nodo', () => {
    const block = createDefaultFlujoBlock({ id: 'b-campos' }) as DiagramaGrafoBlock;
    const out = aplicarDagre(block.nodos, block.aristas);
    expect(out.map((n) => n.id)).toEqual(block.nodos.map((n) => n.id));
    out.forEach((n, i) => {
      const { x: _x, y: _y, ...resto } = n;
      const { x: _ox, y: _oy, ...restoOriginal } = block.nodos[i];
      expect(resto).toEqual(restoOriginal);
    });
  });

  it('un nodo que dagre no devuelve conserva su posición y sin nodos no falla', () => {
    expect(aplicarDagre([], [])).toEqual([]);
    const solo: DiagramaNodo[] = [{ id: 'a', etiqueta: 'A', x: 7, y: 9 }];
    expect(aplicarDagre(solo, [{ id: 'e', desdeId: 'a', haciaId: 'fantasma' }])).toHaveLength(1);
  });

  it('acepta otra dirección (la usará V3.1): LR no coloca los rangos en vertical', () => {
    const block = createDefaultFlujoBlock({ id: 'b-lr' }) as DiagramaGrafoBlock;
    const tb = aplicarDagre(block.nodos, block.aristas);
    const lr = aplicarDagre(block.nodos, block.aristas, { direction: 'LR' });
    expect(lr).not.toEqual(tb);
  });
});
