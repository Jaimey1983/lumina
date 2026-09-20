/**
 * graph-core — bridge puro entre `GraphModel` y `@xyflow/react`.
 *
 * Sin JSX, sin hooks, sin imports en runtime de `@xyflow/react` (sólo `import
 * type`), para que las pruebas corran en el proyecto `unit` de Vitest (entorno
 * node, `*.spec.ts`).
 *
 * Contrato de round-trip (probado en `lumina-rf-bridge.spec.ts`):
 *   applyPositionPatches(m.nodes, m.nodes.map(n => rfNodeToPatch(graphNodeToRF(n))))
 *   ≡ m.nodes    (mismos ids, misma x/y; identidad de array si nada cambió)
 */

import type {
  Node as RFNode,
  Edge as RFEdge,
  NodeChange,
  EdgeMarker,
} from '@xyflow/react';

import type {
  GraphNode,
  GraphEdge,
  GraphNodePositionPatch,
  GraphPositionAuthority,
} from './types.js';

/** `type` del nodo custom que renderiza `graph-canvas.tsx`. */
export const GRAPH_CARD_NODE_TYPE = 'luminaGraphCard';
export const LUMINA_EDGE_TYPE = 'luminaEdge';

/** `data` que el bridge escribe y los nodos de React Flow leen. */
export interface GraphCardNodeData {
  label?: string;
  sublabel?: string;
  body?: string;
  accent?: string;
  highlighted?: boolean;
  forma?: string;
  icono?: string;
  imagen?: string;
  blockId?: string;
  isRoot?: boolean;
  subtipo?: string;
  [key: string]: unknown;
}

export type RFGraphNode = RFNode<GraphCardNodeData>;

/** Posiciones de React Flow pueden ser subpíxel; el JSON del dominio va en enteros. */
export function roundPos(value: number): number {
  return Math.round(value);
}

// ─── GraphModel → React Flow ────────────────────────────────────────────────

export function graphNodeToRF(node: GraphNode): RFGraphNode {
  const nodeType =
    (node.meta?.nodeType as string | undefined) ?? GRAPH_CARD_NODE_TYPE;

  return {
    id: node.id,
    type: nodeType,
    position: { x: node.x, y: node.y },
    data: {
      label: node.label,
      sublabel: node.sublabel,
      body: node.body,
      accent: node.accent,
      highlighted: node.highlighted,
      ...(node.meta?.forma ? { forma: String(node.meta.forma) } : {}),
      ...(node.meta?.icono ? { icono: String(node.meta.icono) } : {}),
      ...(node.meta?.imagen ? { imagen: String(node.meta.imagen) } : {}),
      ...(node.meta?.blockId ? { blockId: String(node.meta.blockId) } : {}),
      ...(node.meta?.isRoot !== undefined ? { isRoot: Boolean(node.meta.isRoot) } : {}),
      ...(node.meta?.subtipo ? { subtipo: String(node.meta.subtipo) } : {}),
    },
  };
}

export function graphNodesToRF(nodes: GraphNode[]): RFGraphNode[] {
  return nodes.map(graphNodeToRF);
}

const ARROW_CLOSED = { type: 'arrowclosed' } as EdgeMarker;

export function graphEdgeToRF(edge: GraphEdge): RFEdge {
  const strokeColor = (edge.meta?.color as string | undefined) ?? '#9CA3AF';
  const strokeWidth = (edge.meta?.grosor as number | undefined) ?? 1.5;
  const strokeDasharray =
    edge.meta?.estiloLinea === 'discontinua'
      ? '5,5'
      : edge.meta?.estiloLinea === 'punteada'
        ? '2,2'
        : undefined;

  const edgeType =
    (edge.meta?.edgeType as string | undefined) ??
    (edge.meta?.tipoTrazado ? LUMINA_EDGE_TYPE : undefined);

  const sourceHandle = (edge.meta?.sourceHandle as string | undefined) ?? undefined;
  const targetHandle = (edge.meta?.targetHandle as string | undefined) ?? undefined;

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    ...(sourceHandle ? { sourceHandle } : {}),
    ...(targetHandle ? { targetHandle } : {}),
    ...(edgeType ? { type: edgeType } : {}),
    label: edge.label,
    labelStyle: { fontSize: 10, fill: '#6B7280' },
    style: {
      stroke: strokeColor,
      strokeWidth,
      ...(strokeDasharray ? { strokeDasharray } : {}),
    },
    animated: Boolean(edge.meta?.animada),
    ...(edge.directed
      ? {
          markerEnd: {
            type: 'arrowclosed' as const,
            color: strokeColor,
          },
        }
      : null),
    data: {
      label: edge.label,
      tipoTrazado: edge.meta?.tipoTrazado ?? 'smoothstep',
      ...(edge.meta ?? {}),
    },
  };
}

export function graphEdgesToRF(edges: GraphEdge[]): RFEdge[] {
  return edges.map(graphEdgeToRF);
}

// ─── React Flow → GraphModel ────────────────────────────────────────────────

/** Posición actual de un nodo RF como parche del dominio (enteros). */
export function rfNodeToPatch(
  rfNode: Pick<RFNode, 'id' | 'position'>,
): GraphNodePositionPatch {
  return {
    id: rfNode.id,
    x: roundPos(rfNode.position.x),
    y: roundPos(rfNode.position.y),
  };
}

/**
 * Extrae parches de posición de un lote de `NodeChange`.
 * Ignora todo lo que no sea `position` con `position` definido (los eventos
 * intermedios de drag traen `position: undefined`, no deben persistir).
 */
export function positionChangesToPatches<TNode extends RFNode = RFNode>(
  changes: NodeChange<TNode>[],
): GraphNodePositionPatch[] {
  const out: GraphNodePositionPatch[] = [];
  for (const change of changes) {
    if (change.type === 'position' && change.position) {
      out.push({
        id: change.id,
        x: roundPos(change.position.x),
        y: roundPos(change.position.y),
      });
    }
  }
  return out;
}

/**
 * Aplica parches de posición al modelo de dominio de forma inmutable.
 * Devuelve el MISMO array si ningún parche cambia algo (permite `===` en el
 * consumidor para saltarse un `onChange`).
 */
export function applyPositionPatches(
  nodes: GraphNode[],
  patches: GraphNodePositionPatch[],
): GraphNode[] {
  if (patches.length === 0) return nodes;
  const byId = new Map(patches.map((p) => [p.id, p]));
  let changed = false;
  const next = nodes.map((node) => {
    const patch = byId.get(node.id);
    if (!patch || (patch.x === node.x && patch.y === node.y)) return node;
    changed = true;
    return { ...node, x: patch.x, y: patch.y };
  });
  return changed ? next : nodes;
}

/**
 * Funde el modelo de dominio sobre el estado transitorio de React Flow.
 *
 * - Nodos que siguen existiendo: conserva la instancia de RF (flags `selected`,
 *   `dragging`, `measured`…), pero sobrescribe `data` y `type` desde el dominio.
 *   La posición depende de `authority`:
 *     · `'rf'`    → se conserva la de React Flow (el drag manda).
 *     · `'model'` → se toma la del dominio (auto-layout / reposición).
 * - Nodos nuevos en el dominio: se crean con `graphNodeToRF` (posición del modelo).
 * - Nodos que el dominio ya no tiene: se eliminan.
 * - El orden resultante es el del dominio.
 */
export function reconcileRFNodes(
  domain: GraphNode[],
  current: RFGraphNode[],
  authority: GraphPositionAuthority = 'rf',
): RFGraphNode[] {
  const currentById = new Map(current.map((n) => [n.id, n]));
  return domain.map((node) => {
    const fresh = graphNodeToRF(node);
    const prev = currentById.get(node.id);
    if (!prev) return fresh;
    return {
      ...prev,
      type: fresh.type,
      data: fresh.data,
      position: authority === 'model' ? fresh.position : prev.position,
    };
  });
}

/**
 * Re-deriva las aristas del lienzo desde el modelo. Las aristas no tienen estado
 * transitorio de arrastre, así que se reconstruyen enteras (sin merge).
 */
export function reconcileRFEdges(domain: GraphEdge[]): RFEdge[] {
  return domain.map(graphEdgeToRF);
}
