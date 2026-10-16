// ─── Puente entre Bloque Diagrama y graph-core ────────────────────────────────
// Convierte entre DiagramaGrafoBlock y el GraphModel agnóstico de React Flow.

import type { DiagramaArista, DiagramaGrafoBlock, DiagramaNodo } from '@lumina/types/slide';
import type { GraphEdge, GraphModel, GraphNode } from '@lumina/editor-shared/graph-editor';
import { resolverEstiloArista, resolverEstiloDiagrama, resolverEstiloNodo } from './diagrama-temas.js';
import type { EstiloVisualNodo } from './diagrama-shape-node.js';

/**
 * Convierte un bloque DiagramaGrafoBlock al modelo agnóstico GraphModel de graph-core.
 */
/** Color de arista cuando ni la arista ni el estilo definen uno: sigue el tema (claro/oscuro). */
export const COLOR_ARISTA_TEMA = 'var(--muted-foreground)';

export function diagramaToGraphModel(block: DiagramaGrafoBlock): GraphModel {
  const estiloExplicito = block.opciones?.estilo;
  const estiloResuelto = resolverEstiloDiagrama(block.opciones, block.subtipo);
  const nodes: GraphNode[] = block.nodos.map((n, idx) => {
    const isRoot = idx === 0 || n.estilo?.destacado === true;
    const accent =
      typeof n.estilo?.color === 'string'
        ? n.estilo.color
        : isRoot
          ? '#2563EB' // Azul principal para raíz
          : '#0D9488'; // Teal para ramas

    // Solo con estilo explícito: sin él, cada forma conserva su aspecto propio.
    let estiloVisual: EstiloVisualNodo | undefined;
    if (estiloExplicito?.relleno || estiloExplicito?.sombra === false) {
      const nodo = resolverEstiloNodo(estiloResuelto, accent);
      estiloVisual = {
        ...(estiloExplicito.relleno
          ? { relleno: nodo.relleno, rellenoCss: nodo.rellenoCss, colorTexto: nodo.colorTexto }
          : {}),
        ...(estiloExplicito.sombra === false ? { sinSombra: true } : {}),
      };
    }

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
        ancho: n.ancho,
        alto: n.alto,
        subtipo: block.subtipo,
        isRoot,
        ...(estiloVisual ? { estiloVisual } : {}),
        nodeType: 'diagramaShapeNode',
      },
    };
  });

  const nodeMap = new Map(block.nodos.map((n) => [n.id, n]));

  const edges: GraphEdge[] = block.aristas.map((a) => {
    const sourceNode = nodeMap.get(a.desdeId);
    const targetNode = nodeMap.get(a.haciaId);

    // Enrutamiento inteligente de puertos según la posición geométrica relativa
    let sourceHandle = 'source-bottom';
    let targetHandle = 'top';

    if (sourceNode && targetNode) {
      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;

      if (Math.abs(dx) >= Math.abs(dy)) {
        // Predominantemente horizontal
        if (dx >= 0) {
          sourceHandle = 'source-right';
          targetHandle = 'left';
        } else {
          sourceHandle = 'source-left';
          targetHandle = 'right';
        }
      } else {
        // Predominantemente vertical
        if (dy >= 0) {
          sourceHandle = 'source-bottom';
          targetHandle = 'top';
        } else {
          sourceHandle = 'source-top';
          targetHandle = 'bottom';
        }
      }
    }

    const conector = resolverEstiloArista(a, estiloResuelto);

    return {
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
        sourceHandle,
        targetHandle,
        tipoTrazado: conector.trazado,
        estiloLinea: conector.patron,
        color: a.color ?? COLOR_ARISTA_TEMA,
        grosor: conector.grosor,
        flechaInicio: a.flechaInicio,
      },
    };
  });

  return { nodes, edges };
}

/** Una arista nueva no debe heredar el color-de-tema como si fuera una elección. */
function nuevoColor(color: unknown): string | undefined {
  return typeof color === 'string' && color !== COLOR_ARISTA_TEMA ? color : undefined;
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
      ...(original?.ancho !== undefined ? { ancho: original.ancho } : {}),
      ...(original?.alto !== undefined ? { alto: original.alto } : {}),
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
      // Una arista que ya existía conserva lo que el bloque declara: los valores de `meta`
      // son los ya resueltos (estilo del diagrama, subtipo, tema) y volcarlos aquí los fijaría.
      ...(original
        ? {
            tipoTrazado: original.tipoTrazado,
            estiloLinea: original.estiloLinea,
            color: original.color,
            grosor: original.grosor,
            flechaInicio: original.flechaInicio,
          }
        : {
            tipoTrazado: e.meta?.tipoTrazado as DiagramaArista['tipoTrazado'],
            estiloLinea: e.meta?.estiloLinea as DiagramaArista['estiloLinea'],
            color: nuevoColor(e.meta?.color),
            grosor: e.meta?.grosor as number | undefined,
            flechaInicio: e.meta?.flechaInicio as boolean | undefined,
          })
    };
  });

  return {
    ...block,
    nodos,
    aristas,
  };
}
