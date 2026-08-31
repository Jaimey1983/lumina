'use client';

/**
 * graph-core — lienzo de grafo reutilizable sobre `@xyflow/react`.
 *
 * - El consumidor mantiene su JSON de dominio y lo pasa como `model`.
 * - graph-canvas es dueño del estado transitorio de React Flow (drag, zoom,
 *   selección) y lo re-sincroniza con `model` vía `reconcileRF*`.
 * - Eventos hacia afuera: `onNodesMove` (drag), `onConnect` (intento),
 *   `onNodeSelect` (clic). Ninguno persiste por frame — el consumidor aplica
 *   debounce / commit-al-soltar (PLAN_ACCION_DIAGRAMAS_GRAFICOS §1.13).
 * - `interactive={false}` deja el lienzo inerte (§7: sólo captura pointer con
 *   el bloque canvas seleccionado).
 */

import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Connection,
  type NodeChange,
  type NodeMouseHandler,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { cn } from '@/lib/utils';

import {
  GRAPH_CARD_NODE_TYPE,
  graphNodesToRF,
  positionChangesToPatches,
  reconcileRFEdges,
  reconcileRFNodes,
  type GraphCardNodeData,
  type RFGraphNode,
} from './lumina-rf-bridge';
import type {
  GraphConnectAttempt,
  GraphModel,
  GraphNodePositionPatch,
  GraphPositionAuthority,
} from './types';

export interface GraphCanvasProps {
  model: GraphModel;
  /** Drag de nodos. NO persiste por frame — aplicar §1.13 en el consumidor. */
  onNodesMove?: (patches: GraphNodePositionPatch[]) => void;
  /** Intento de conexión; el consumidor valida y actualiza `model`. */
  onConnect?: (attempt: GraphConnectAttempt) => void;
  /** Clic en un nodo. */
  onNodeSelect?: (id: string) => void;
  /** Clic en el fondo (passthrough de `onPaneClick`). */
  onPaneClick?: () => void;
  /** §7 — captura de pointer sólo con el bloque seleccionado. Default `true`. */
  interactive?: boolean;
  /** Quién manda en la posición al re-sincronizar. Default `'rf'`. */
  positionAuthority?: GraphPositionAuthority;
  fitView?: boolean;
  minHeight?: number;
  showControls?: boolean;
  showMiniMap?: boolean;
  showBackground?: boolean;
  /** Toolbar u overlays flotantes dentro del área del lienzo. */
  children?: React.ReactNode;
  className?: string;
}

function GraphCardNode({ data }: NodeProps<RFGraphNode>) {
  const accent = data.accent ?? '#6B7280';
  return (
    <div
      style={{
        border: `2px solid ${accent}`,
        borderRadius: 10,
        backgroundColor: data.highlighted ? '#EFF6FF' : '#FFFFFF',
        minWidth: 140,
        boxShadow: data.highlighted ? '0 0 0 3px #BFDBFE' : undefined,
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex flex-col items-start gap-0.5 p-1">
        {data.label != null && (
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded text-white"
            style={{ backgroundColor: accent }}
          >
            {data.label}
          </span>
        )}
        {data.sublabel != null && (
          <span className="text-xs text-gray-700 font-medium mt-0.5">
            {data.sublabel}
          </span>
        )}
        {data.body ? (
          <span className="text-xs text-gray-400 leading-tight line-clamp-2">
            {data.body}
          </span>
        ) : null}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const NODE_TYPES = { [GRAPH_CARD_NODE_TYPE]: GraphCardNode };

export function GraphCanvas({
  model,
  onNodesMove,
  onConnect,
  onNodeSelect,
  onPaneClick,
  interactive = true,
  positionAuthority = 'rf',
  fitView = true,
  minHeight = 400,
  showControls = true,
  showMiniMap = true,
  showBackground = true,
  children,
  className,
}: GraphCanvasProps) {
  const [rfNodes, setRfNodes, onRfNodesChange] = useNodesState<RFGraphNode>(
    graphNodesToRF(model.nodes),
  );
  const [rfEdges, setRfEdges, onRfEdgesChange] = useEdgesState(
    reconcileRFEdges(model.edges),
  );

  // Re-sincroniza el estado de React Flow cuando cambia el modelo de dominio.
  // Con `positionAuthority: 'rf'` (default) el drag manda: el modelo sólo aporta
  // `data` y la posición de nodos nuevos, así el ciclo drag → onNodesMove →
  // model nuevo → este efecto no reintroduce jitter.
  useEffect(() => {
    setRfNodes((current) =>
      reconcileRFNodes(model.nodes, current, positionAuthority),
    );
  }, [model.nodes, positionAuthority, setRfNodes]);

  useEffect(() => {
    setRfEdges(reconcileRFEdges(model.edges));
  }, [model.edges, setRfEdges]);

  const handleNodesChange = useCallback(
    (changes: NodeChange<RFGraphNode>[]) => {
      onRfNodesChange(changes);
      const patches = positionChangesToPatches(changes);
      if (patches.length > 0) onNodesMove?.(patches);
    },
    [onRfNodesChange, onNodesMove],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      onConnect?.({ source: connection.source, target: connection.target });
    },
    [onConnect],
  );

  const handleNodeClick = useCallback<NodeMouseHandler<RFGraphNode>>(
    (_, node) => {
      onNodeSelect?.(node.id);
    },
    [onNodeSelect],
  );

  return (
    <div
      className={cn('relative h-full w-full', className)}
      style={{ minHeight, pointerEvents: interactive ? undefined : 'none' }}
    >
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={NODE_TYPES}
        onNodesChange={handleNodesChange}
        onEdgesChange={onRfEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={onPaneClick}
        nodesDraggable={interactive}
        nodesConnectable={interactive}
        elementsSelectable={interactive}
        panOnDrag={interactive}
        zoomOnScroll={interactive}
        zoomOnPinch={interactive}
        zoomOnDoubleClick={interactive}
        fitView={fitView}
        attributionPosition="bottom-right"
      >
        {showBackground && <Background color="#E5E7EB" gap={20} />}
        {showControls && <Controls />}
        {showMiniMap && (
          <MiniMap
            nodeColor={(node) =>
              (node.data as GraphCardNodeData | undefined)?.accent ?? '#6B7280'
            }
          />
        )}
      </ReactFlow>
      {children}
    </div>
  );
}

export default GraphCanvas;
