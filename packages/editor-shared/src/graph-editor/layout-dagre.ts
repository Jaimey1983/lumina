import dagre from '@dagrejs/dagre';
import type { GraphEdge, GraphNode } from './types.js';

export interface DagreLayoutOptions {
  direction?: 'TB' | 'LR' | 'BT' | 'RL';
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
}

/**
 * Calcula un layout jerárquico determinista usando dagre.
 * Devuelve un nuevo array de nodos con sus posiciones x e y calculadas.
 */
export function computeDagreLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: DagreLayoutOptions = {},
): GraphNode[] {
  if (nodes.length === 0) return [];

  const {
    direction = 'TB',
    nodeWidth = 160,
    nodeHeight = 70,
    rankSep = 60,
    nodeSep = 40,
  } = options;

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    ranksep: rankSep,
    nodesep: nodeSep,
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    const w = (node.meta?.ancho as number | undefined) ?? nodeWidth;
    const h = (node.meta?.alto as number | undefined) ?? nodeHeight;
    g.setNode(node.id, { width: w, height: h });
  }

  for (const edge of edges) {
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const dagreNode = g.node(node.id);
    if (!dagreNode) return node;

    // dagre ubica el centro del nodo en (x, y); convertimos a top-left
    const w = dagreNode.width ?? nodeWidth;
    const h = dagreNode.height ?? nodeHeight;
    const x = Math.round(dagreNode.x - w / 2);
    const y = Math.round(dagreNode.y - h / 2);

    return {
      ...node,
      x,
      y,
    };
  });
}
