import { describe, expect, it } from 'vitest';
import {
  computeDagreLayout,
  type GraphEdge,
  type GraphNode,
} from '@lumina/editor-shared/graph-editor';
import type { DiagramaArista, DiagramaGrafoBlock, DiagramaNodo } from '@lumina/types/slide';

import {
  aplicarDagre,
  organizarGrafo,
  resolverDensidad,
  resolverDireccion,
  SEPARACION_POR_DENSIDAD,
  SUBTIPOS_LAYOUT_PROPIO,
  tieneLayoutPropio,
} from './diagrama-dagre.js';
import { layoutRadial } from './layout-pedagogico.js';
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
      // Sin x/y (las únicas que cambian) el nodo es idéntico al original.
      expect({ ...n, x: 0, y: 0 }).toEqual({ ...block.nodos[i], x: 0, y: 0 });
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

describe('dirección y densidad del layout (V3.1)', () => {
  // Cadena a → b → c → d con posiciones de partida cualesquiera.
  const nodos: DiagramaNodo[] = ['a', 'b', 'c', 'd'].map((id, i) => ({ id, etiqueta: id, x: i * 7, y: i * 3 }));
  const aristas: DiagramaArista[] = [
    { id: 'ab', desdeId: 'a', haciaId: 'b' },
    { id: 'bc', desdeId: 'b', haciaId: 'c' },
    { id: 'cd', desdeId: 'c', haciaId: 'd' },
  ];
  const pos = (out: DiagramaNodo[], id: string) => out.find((n) => n.id === id)!;

  function organizar(direccionLayout?: 'TB' | 'LR' | 'BT' | 'RL' | 'radial', densidad?: 'compacta' | 'normal' | 'amplia') {
    return organizarGrafo(nodos, aristas, 'flujo', {
      ...(direccionLayout ? { direccionLayout } : {}),
      ...(densidad ? { densidad } : {}),
    });
  }

  it('resuelve la dirección: la elegida, o radial en mapa mental y TB en el resto', () => {
    expect(resolverDireccion(undefined, 'mapa_mental')).toBe('radial');
    expect(resolverDireccion(undefined, 'flujo')).toBe('TB');
    expect(resolverDireccion({ direccionLayout: 'LR' }, 'mapa_mental')).toBe('LR');
    expect(resolverDensidad(undefined)).toBe('normal');
    expect(resolverDensidad({ densidad: 'amplia' })).toBe('amplia');
  });

  it('TB crece en vertical y LR en horizontal: los ejes se intercambian', () => {
    const tb = organizar('TB');
    const lr = organizar('LR');
    // TB: cada paso baja (y crece) y x no cambia; LR: cada paso avanza (x crece) y y no cambia.
    expect(pos(tb, 'd').y).toBeGreaterThan(pos(tb, 'a').y);
    expect(pos(tb, 'd').x).toBe(pos(tb, 'a').x);
    expect(pos(lr, 'd').x).toBeGreaterThan(pos(lr, 'a').x);
    expect(pos(lr, 'd').y).toBe(pos(lr, 'a').y);
  });

  it('BT y RL invierten el sentido de TB y LR', () => {
    const bt = organizar('BT');
    const rl = organizar('RL');
    expect(pos(bt, 'd').y).toBeLessThan(pos(bt, 'a').y);
    expect(pos(rl, 'd').x).toBeLessThan(pos(rl, 'a').x);
  });

  it('sin opciones el resultado es el de siempre (TB, densidad normal)', () => {
    expect(organizar()).toEqual(aplicarDagre(nodos, aristas));
    expect(SEPARACION_POR_DENSIDAD.normal).toEqual({ rankSep: 60, nodeSep: 40 });
  });

  it('la densidad separa más o menos los rangos', () => {
    const paso = (out: DiagramaNodo[]) => pos(out, 'b').y - pos(out, 'a').y;
    expect(paso(organizar('TB', 'compacta'))).toBeLessThan(paso(organizar('TB', 'normal')));
    expect(paso(organizar('TB', 'amplia'))).toBeGreaterThan(paso(organizar('TB', 'normal')));
  });

  it('radial delega en layoutRadial', () => {
    expect(organizar('radial')).toEqual(layoutRadial(nodos, aristas));
  });

  it('el mapa mental sin opciones sigue siendo radial', () => {
    expect(organizarGrafo(nodos, aristas, 'mapa_mental', undefined)).toEqual(layoutRadial(nodos, aristas));
  });

  it('pirámide, embudo, cebolla y cronología tienen disposición propia; el resto no', () => {
    expect([...SUBTIPOS_LAYOUT_PROPIO].sort()).toEqual(['cebolla', 'cronologia', 'embudo', 'piramide']);
    for (const s of ['piramide', 'embudo', 'cebolla', 'cronologia'] as const) expect(tieneLayoutPropio(s)).toBe(true);
    for (const s of ['flujo', 'organigrama', 'mapa_conceptual', 'mapa_mental'] as const) expect(tieneLayoutPropio(s)).toBe(false);
  });
});
