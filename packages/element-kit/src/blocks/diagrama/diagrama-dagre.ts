// ─── Layout jerárquico (dagre) sobre nodos/aristas de un diagrama ─────────────
// Única implementación del patrón «nodos → GraphNode → dagre → posiciones»
// que antes estaba copiada en `diagrama-properties.tsx` (cambio de subtipo,
// «Auto-Organizar» y esquema por sangría).

import type { DiagramaArista, DiagramaNodo } from '@lumina/types/slide';
import {
  computeDagreLayout,
  type DagreLayoutOptions,
  type GraphEdge,
  type GraphNode,
} from '@lumina/editor-shared/graph-editor';

/**
 * Devuelve `nodos` con `x`/`y` recalculadas por dagre (dirección `TB` por
 * defecto). No toca el resto de campos del nodo ni reordena el arreglo; un
 * nodo que dagre no devuelve conserva su posición.
 */
export function aplicarDagre(
  nodos: DiagramaNodo[],
  aristas: DiagramaArista[],
  opts: DagreLayoutOptions = { direction: 'TB' },
): DiagramaNodo[] {
  const graphNodes: GraphNode[] = nodos.map((n) => ({ id: n.id, x: n.x, y: n.y }));
  const graphEdges: GraphEdge[] = aristas.map((a) => ({
    id: a.id,
    source: a.desdeId,
    target: a.haciaId,
  }));

  const posMap = new Map(computeDagreLayout(graphNodes, graphEdges, opts).map((l) => [l.id, l]));
  return nodos.map((n) => {
    const p = posMap.get(n.id);
    return p ? { ...n, x: p.x, y: p.y } : n;
  });
}
