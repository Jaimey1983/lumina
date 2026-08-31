import { describe, expect, it } from 'vitest';

import type { NodeChange } from '@xyflow/react';

import {
  GRAPH_CARD_NODE_TYPE,
  applyPositionPatches,
  graphEdgeToRF,
  graphNodeToRF,
  graphNodesToRF,
  positionChangesToPatches,
  reconcileRFEdges,
  reconcileRFNodes,
  rfNodeToPatch,
  roundPos,
  type RFGraphNode,
} from './lumina-rf-bridge';
import type { GraphEdge, GraphNode } from './types';

function node(over: Partial<GraphNode> = {}): GraphNode {
  return { id: 'n1', x: 10, y: 20, label: 'Narración', ...over };
}

describe('graphNodeToRF', () => {
  it('mapea id, posición, type custom y data primitiva', () => {
    const rf = graphNodeToRF(
      node({ id: 'a', x: 5, y: 7, sublabel: 'Título', body: 'Cuerpo', accent: '#f00', highlighted: true }),
    );
    expect(rf).toMatchObject({
      id: 'a',
      type: GRAPH_CARD_NODE_TYPE,
      position: { x: 5, y: 7 },
      data: {
        label: 'Narración',
        sublabel: 'Título',
        body: 'Cuerpo',
        accent: '#f00',
        highlighted: true,
      },
    });
  });

  it('no arrastra `meta` del dominio a `data` de React Flow', () => {
    const rf = graphNodeToRF(node({ meta: { tipo: 'decision', opciones: [1, 2] } }));
    expect(rf.data).not.toHaveProperty('meta');
    expect(rf.data).not.toHaveProperty('opciones');
  });
});

describe('round-trip de posiciones', () => {
  it('graphNodeToRF → rfNodeToPatch → applyPositionPatches preserva id y x/y', () => {
    const nodes = [node({ id: 'a', x: 0, y: 0 }), node({ id: 'b', x: 120, y: -40 })];
    const patches = graphNodesToRF(nodes).map(rfNodeToPatch);
    const out = applyPositionPatches(nodes, patches);
    expect(out.map((n) => [n.id, n.x, n.y])).toEqual([
      ['a', 0, 0],
      ['b', 120, -40],
    ]);
  });

  it('devuelve el MISMO array si ningún parche cambia algo (identidad para saltar onChange)', () => {
    const nodes = [node({ id: 'a', x: 3, y: 4 })];
    const same = applyPositionPatches(nodes, [{ id: 'a', x: 3, y: 4 }]);
    expect(same).toBe(nodes);
  });

  it('sólo clona los nodos movidos; el resto conserva su referencia', () => {
    const a = node({ id: 'a', x: 0, y: 0 });
    const b = node({ id: 'b', x: 10, y: 10 });
    const out = applyPositionPatches([a, b], [{ id: 'b', x: 99, y: 99 }]);
    expect(out[0]).toBe(a);
    expect(out[1]).not.toBe(b);
    expect(out[1]).toMatchObject({ id: 'b', x: 99, y: 99 });
  });

  it('array vacío de parches → mismo array', () => {
    const nodes = [node()];
    expect(applyPositionPatches(nodes, [])).toBe(nodes);
  });
});

describe('roundPos / positionChangesToPatches', () => {
  it('redondea subpíxeles a entero', () => {
    expect(roundPos(12.4)).toBe(12);
    expect(roundPos(12.5)).toBe(13);
    expect(roundPos(-1.4)).toBe(-1);
  });

  it('ignora cambios que no son de posición y los `position: undefined` (drag intermedio)', () => {
    const changes = [
      { type: 'position', id: 'a', position: { x: 1.6, y: 2.2 }, dragging: true },
      { type: 'position', id: 'b', dragging: true },
      { type: 'select', id: 'c', selected: true },
      { type: 'dimensions', id: 'd', dimensions: { width: 10, height: 10 } },
    ] as unknown as NodeChange[];
    expect(positionChangesToPatches(changes)).toEqual([{ id: 'a', x: 2, y: 2 }]);
  });

  it('sin cambios de posición → lista vacía', () => {
    const changes = [{ type: 'select', id: 'a', selected: false }] as unknown as NodeChange[];
    expect(positionChangesToPatches(changes)).toEqual([]);
  });
});

describe('graphEdgeToRF', () => {
  const base: GraphEdge = { id: 'e1', source: 'a', target: 'b', label: 'sí' };

  it('propaga id/source/target/label y estilo base', () => {
    const rf = graphEdgeToRF(base);
    expect(rf).toMatchObject({ id: 'e1', source: 'a', target: 'b', label: 'sí', animated: false });
    expect(rf.style).toMatchObject({ stroke: '#9CA3AF' });
  });

  it('sin `directed` no pone marcador de flecha', () => {
    expect(graphEdgeToRF(base).markerEnd).toBeUndefined();
  });

  it('con `directed` pone punta de flecha cerrada', () => {
    expect(graphEdgeToRF({ ...base, directed: true }).markerEnd).toMatchObject({
      type: 'arrowclosed',
    });
  });
});

describe('reconcileRFNodes', () => {
  const domain = [
    node({ id: 'a', x: 0, y: 0, label: 'A' }),
    node({ id: 'b', x: 50, y: 50, label: 'B' }),
  ];

  function current(): RFGraphNode[] {
    return [
      { ...graphNodeToRF(node({ id: 'a', x: 0, y: 0, label: 'A' })), selected: true, position: { x: 999, y: 999 } },
      graphNodeToRF(node({ id: 'b', x: 50, y: 50, label: 'B' })),
    ];
  }

  it("authority 'rf' (default): conserva la posición de React Flow y sus flags", () => {
    const out = reconcileRFNodes(
      [node({ id: 'a', x: 0, y: 0, label: 'A-editado' }), domain[1]],
      current(),
    );
    expect(out[0].position).toEqual({ x: 999, y: 999 });
    expect(out[0].selected).toBe(true);
    expect(out[0].data.label).toBe('A-editado');
  });

  it("authority 'model': toma la posición del dominio (auto-layout)", () => {
    const out = reconcileRFNodes(domain, current(), 'model');
    expect(out[0].position).toEqual({ x: 0, y: 0 });
  });

  it('añade nodos nuevos del dominio con su posición y elimina los que ya no están', () => {
    const out = reconcileRFNodes(
      [domain[0], node({ id: 'c', x: 300, y: 10, label: 'C' })],
      current(),
    );
    expect(out.map((n) => n.id)).toEqual(['a', 'c']);
    expect(out[1].position).toEqual({ x: 300, y: 10 });
  });

  it('respeta el orden del dominio', () => {
    const out = reconcileRFNodes([domain[1], domain[0]], current());
    expect(out.map((n) => n.id)).toEqual(['b', 'a']);
  });
});

describe('reconcileRFEdges', () => {
  it('reconstruye las aristas enteras desde el modelo', () => {
    const edges: GraphEdge[] = [
      { id: 'e1', source: 'a', target: 'b', label: 'x' },
      { id: 'e2', source: 'b', target: 'c', directed: true },
    ];
    const out = reconcileRFEdges(edges);
    expect(out.map((e) => e.id)).toEqual(['e1', 'e2']);
    expect(out[1].markerEnd).toMatchObject({ type: 'arrowclosed' });
  });
});
