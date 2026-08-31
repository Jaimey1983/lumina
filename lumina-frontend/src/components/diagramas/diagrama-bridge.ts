// ─── Puente entre Bloque Diagrama y graph-core ────────────────────────────────
// Convierte entre DiagramaGrafoBlock y el GraphModel agnóstico de React Flow.

import type { DiagramaArista, DiagramaGrafoBlock, DiagramaNodo } from '@/types/slide.types';
import type { GraphEdge, GraphModel, GraphNode } from '@/lib/graph-editor';

/**
 * Convierte un bloque DiagramaGrafoBlock al modelo agnóstico GraphModel de graph-core.
 */
export function diagramaToGraphModel(block: DiagramaGrafoBlock): GraphModel {
  const nodes: GraphNode[] = block.nodos.map((n, idx) => {
    const isRoot = idx === 0 || n.estilo?.destacado === true;
    const accent =
      typeof n.estilo?.color === 'string'
        ? n.estilo.color
        : isRoot
          ? '#2563EB' // Azul principal para raíz
          : '#0D9488'; // Teal para ramas

    return {
      id: n.id,
      x: n.x,
      y: n.y,
      label: n.etiqueta,
      body: n.cuerpo,
      accent,
      highlighted: Boolean(isRoot),
      meta: { estilo: n.estilo },
    };
  });

  const edges: GraphEdge[] = block.aristas.map((a) => ({
    id: a.id,
    source: a.desdeId,
    target: a.haciaId,
    label: a.etiqueta,
    directed:
      a.dirigida !== undefined
        ? a.dirigida
        : block.subtipo === 'flujo' ||
          block.subtipo === 'organigrama' ||
          block.subtipo === 'mapa_conceptual' ||
          block.subtipo === 'cronologia',
  }));

  return { nodes, edges };
}

/**
 * Aplica los cambios de un GraphModel (posiciones, nuevos nodos, aristas) de vuelta a un DiagramaGrafoBlock.
 */
export function applyGraphModelToDiagrama(
  block: DiagramaGrafoBlock,
  model: GraphModel,
): DiagramaGrafoBlock {
  const nodos: DiagramaNodo[] = model.nodes.map((n) => {
    const original = block.nodos.find((orig) => orig.id === n.id);
    return {
      id: n.id,
      etiqueta: n.label ?? original?.etiqueta ?? 'Idea',
      cuerpo: n.body ?? original?.cuerpo,
      x: Math.round(n.x),
      y: Math.round(n.y),
      estilo: {
        ...(original?.estilo ?? {}),
        ...(n.meta?.estilo as Record<string, unknown> | undefined),
        ...(n.accent ? { color: n.accent } : {}),
        ...(n.highlighted ? { destacado: true } : {}),
      },
    };
  });

  const aristas: DiagramaArista[] = model.edges.map((e) => {
    const original = block.aristas.find((orig) => orig.id === e.id);
    return {
      id: e.id,
      desdeId: e.source,
      haciaId: e.target,
      etiqueta: e.label ?? original?.etiqueta,
      dirigida:
        e.directed !== undefined
          ? e.directed
          : original?.dirigida ??
            (block.subtipo === 'flujo' ||
              block.subtipo === 'organigrama' ||
              block.subtipo === 'mapa_conceptual'),
    };
  });

  return {
    ...block,
    nodos,
    aristas,
  };
}
