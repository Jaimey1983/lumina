import { describe, expect, it } from 'vitest';
import { computeDagreLayout } from './layout-dagre.js';
import type { GraphEdge, GraphNode } from './types.js';

describe('computeDagreLayout', () => {
  it('devuelve array vacío si no hay nodos', () => {
    expect(computeDagreLayout([], [])).toEqual([]);
  });

  it('organiza nodos jerárquicamente de arriba hacia abajo (TB)', () => {
    const nodes: GraphNode[] = [
      { id: 'raiz', x: 0, y: 0, label: 'Raíz' },
      { id: 'hijo-1', x: 0, y: 0, label: 'Hijo 1' },
      { id: 'hijo-2', x: 0, y: 0, label: 'Hijo 2' },
    ];
    const edges: GraphEdge[] = [
      { id: 'e1', source: 'raiz', target: 'hijo-1' },
      { id: 'e2', source: 'raiz', target: 'hijo-2' },
    ];

    const laidOut = computeDagreLayout(nodes, edges, { direction: 'TB' });

    const raiz = laidOut.find((n) => n.id === 'raiz')!;
    const hijo1 = laidOut.find((n) => n.id === 'hijo-1')!;
    const hijo2 = laidOut.find((n) => n.id === 'hijo-2')!;

    // La raíz debe estar arriba de los hijos en dirección TB
    expect(raiz.y).toBeLessThan(hijo1.y);
    expect(raiz.y).toBeLessThan(hijo2.y);
    // Los hijos deben estar en el mismo nivel y separados en X
    expect(hijo1.y).toBe(hijo2.y);
    expect(hijo1.x).not.toBe(hijo2.x);
  });

  it('organiza nodos horizontalmente de izquierda a derecha (LR)', () => {
    const nodes: GraphNode[] = [
      { id: 'paso-1', x: 0, y: 0, label: 'Paso 1' },
      { id: 'paso-2', x: 0, y: 0, label: 'Paso 2' },
    ];
    const edges: GraphEdge[] = [{ id: 'e1', source: 'paso-1', target: 'paso-2' }];

    const laidOut = computeDagreLayout(nodes, edges, { direction: 'LR' });

    const p1 = laidOut.find((n) => n.id === 'paso-1')!;
    const p2 = laidOut.find((n) => n.id === 'paso-2')!;

    expect(p1.x).toBeLessThan(p2.x);
  });

  it('es determinista: las mismas entradas producen exactamente las mismas posiciones', () => {
    const nodes: GraphNode[] = [
      { id: 'a', x: 10, y: 20 },
      { id: 'b', x: 30, y: 40 },
    ];
    const edges: GraphEdge[] = [{ id: 'e1', source: 'a', target: 'b' }];

    const run1 = computeDagreLayout(nodes, edges);
    const run2 = computeDagreLayout(nodes, edges);

    expect(run1).toEqual(run2);
  });
});
