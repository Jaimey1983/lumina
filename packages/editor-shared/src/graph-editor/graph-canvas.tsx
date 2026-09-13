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

import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useNodesState,
  useEdgesState,
  type Connection,
  type NodeChange,
  type NodeMouseHandler,
  type NodeProps,
  type EdgeProps,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { cn } from '@lumina/ui/lib/utils';

import {
  GRAPH_CARD_NODE_TYPE,
  LUMINA_EDGE_TYPE,
  graphNodesToRF,
  positionChangesToPatches,
  reconcileRFEdges,
  reconcileRFNodes,
  type GraphCardNodeData,
  type RFGraphNode,
} from './lumina-rf-bridge.js';
import type {
  GraphConnectAttempt,
  GraphModel,
  GraphNodePositionPatch,
  GraphPositionAuthority,
} from './types.js';

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
  /** Tipos de nodo personalizados adicionales para este lienzo. */
  nodeTypes?: NodeTypes;
  /** Tipos de arista personalizados adicionales para este lienzo. */
  edgeTypes?: EdgeTypes;
  /** Toolbar u overlays flotantes dentro del área del lienzo. */
  children?: React.ReactNode;
  className?: string;
}

export function LuminaEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  data,
}: EdgeProps) {
  const tipoTrazado = (data?.tipoTrazado as string | undefined) ?? 'smoothstep';

  let edgePath = '';
  let labelX = 0;
  let labelY = 0;

  if (tipoTrazado === 'straight') {
    [edgePath, labelX, labelY] = getStraightPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
    });
  } else if (tipoTrazado === 'bezier') {
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  } else {
    // smoothstep / orthogonal con esquinas redondeadas
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 8,
    });
  }

  const edgeLabel = label || (data?.label as string | undefined);

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {edgeLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan rounded-full border border-border/80 bg-card/95 px-2 py-0.5 text-[10px] font-medium text-card-foreground shadow-2xs backdrop-blur-xs select-none"
          >
            {edgeLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

function GraphCardNode({ data }: NodeProps<RFGraphNode>) {
  const accent = data.accent ?? 'var(--primary, #6B7280)';
  return (
    <div
      className={cn(
        'relative rounded-lg border-2 bg-card text-card-foreground shadow-xs transition-shadow min-w-[140px]',
        data.highlighted &&
          'ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5',
      )}
      style={{
        borderColor: accent,
      }}
    >
      {/* Handles cuádruples: anclaje inteligente en 4 direcciones */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-muted-foreground/60 !border-background"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-muted-foreground/60 !border-background"
      />
      <div className="flex flex-col items-start gap-0.5 p-1.5">
        {data.label != null && (
          <span
            className="text-xs font-semibold px-1.5 py-0.5 rounded text-white shadow-2xs"
            style={{ backgroundColor: accent }}
          >
            {data.label}
          </span>
        )}
        {data.sublabel != null && (
          <span className="text-xs text-foreground font-medium mt-0.5">
            {data.sublabel}
          </span>
        )}
        {data.body ? (
          <span className="text-xs text-muted-foreground leading-tight line-clamp-2 mt-0.5">
            {data.body}
          </span>
        ) : null}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-muted-foreground/60 !border-background"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-muted-foreground/60 !border-background"
      />
    </div>
  );
}

const DEFAULT_NODE_TYPES: NodeTypes = {
  [GRAPH_CARD_NODE_TYPE]: GraphCardNode,
};

const DEFAULT_EDGE_TYPES: EdgeTypes = {
  [LUMINA_EDGE_TYPE]: LuminaEdge,
};

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
  nodeTypes,
  edgeTypes,
  children,
  className,
}: GraphCanvasProps) {
  const mergedNodeTypes = useMemo(
    () => ({ ...DEFAULT_NODE_TYPES, ...nodeTypes }),
    [nodeTypes],
  );

  const mergedEdgeTypes = useMemo(
    () => ({ ...DEFAULT_EDGE_TYPES, ...edgeTypes }),
    [edgeTypes],
  );

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
        nodeTypes={mergedNodeTypes}
        edgeTypes={mergedEdgeTypes}
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
        {showBackground && <Background color="var(--border, #E5E7EB)" gap={20} />}
        {showControls && <Controls className="!bg-card !border-border !fill-foreground !text-foreground shadow-xs" />}
        {showMiniMap && (
          <MiniMap
            className="!bg-card/90 !border-border !rounded-md shadow-xs"
            nodeColor={(node) =>
              (node.data as GraphCardNodeData | undefined)?.accent ?? 'var(--primary, #6B7280)'
            }
          />
        )}
      </ReactFlow>
      {children}
    </div>
  );
}

export default GraphCanvas;
