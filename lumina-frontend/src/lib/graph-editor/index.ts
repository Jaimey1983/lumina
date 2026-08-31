/**
 * graph-core (`@/lib/graph-editor`) — capa de grafo reutilizable.
 *
 * Consumidores:
 *  - `components/activities/historia-ramificada/historia-ramificada-editor.tsx` (Capa 1)
 *  - bloques `diagrama` del canvas: mapa mental, organigrama, flujo… (Capa 7+)
 *
 * El componente `GraphCanvas` es `'use client'`; importarlo sólo desde árboles
 * de cliente. Los helpers de `lumina-rf-bridge` son puros (sin React).
 */

export { GraphCanvas, default as GraphCanvasComponent } from './graph-canvas';
export type { GraphCanvasProps } from './graph-canvas';

export {
  GRAPH_CARD_NODE_TYPE,
  roundPos,
  graphNodeToRF,
  graphNodesToRF,
  graphEdgeToRF,
  graphEdgesToRF,
  rfNodeToPatch,
  positionChangesToPatches,
  applyPositionPatches,
  reconcileRFNodes,
  reconcileRFEdges,
} from './lumina-rf-bridge';
export type { GraphCardNodeData, RFGraphNode } from './lumina-rf-bridge';

export type {
  GraphNode,
  GraphEdge,
  GraphModel,
  GraphNodePositionPatch,
  GraphConnectAttempt,
  GraphPositionAuthority,
} from './types';
