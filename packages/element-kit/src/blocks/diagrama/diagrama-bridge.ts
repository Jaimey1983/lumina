// ─── Puente entre Bloque Diagrama y graph-core ────────────────────────────────
// Convierte entre DiagramaGrafoBlock y el GraphModel agnóstico de React Flow.

import type { DiagramaArista, DiagramaGrafoBlock, DiagramaNodo } from '@lumina/types/slide';
import type { GraphEdge, GraphModel, GraphNode } from '@lumina/editor-shared/graph-editor';

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
      meta: {
        blockId: block.id,
        estilo: n.estilo,
        forma: n.forma,
        icono: n.icono,
        imagen: n.imagen,
        subtipo: block.subtipo,
        isRoot,
        nodeType: 'diagramaShapeNode',
      },
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
    meta: {
      tipoTrazado:
        a.tipoTrazado ??
        (block.subtipo === 'flujo' || block.subtipo === 'organigrama'
          ? 'smoothstep'
          : block.subtipo === 'cronologia'
            ? 'straight'
            : 'bezier'),
      estiloLinea: a.estiloLinea ?? 'solida',
      color: a.color,
      grosor: a.grosor,
      flechaInicio: a.flechaInicio,
    },
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
      forma: (n.meta?.forma as DiagramaNodo['forma']) ?? original?.forma,
      icono: (n.meta?.icono as string | undefined) ?? original?.icono,
      imagen: (n.meta?.imagen as string | undefined) ?? original?.imagen,
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
      tipoTrazado: (e.meta?.tipoTrazado as DiagramaArista['tipoTrazado']) ?? original?.tipoTrazado,
      estiloLinea: (e.meta?.estiloLinea as DiagramaArista['estiloLinea']) ?? original?.estiloLinea,
      color: (e.meta?.color as string | undefined) ?? original?.color,
      grosor: (e.meta?.grosor as number | undefined) ?? original?.grosor,
      flechaInicio: (e.meta?.flechaInicio as boolean | undefined) ?? original?.flechaInicio,
    };
  });

  return {
    ...block,
    nodos,
    aristas,
  };
}
