'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { DiagramaBlock, DiagramaGrafoBlock, DiagramaVennBlock } from '@lumina/types/slide';
import { diagramaToGraphModel } from './diagrama-bridge.js';
import { normalizeDiagramaBlock } from './diagrama-defaults.js';
import { assignElementoRegion, regionAtPoint } from './diagrama-regions.js';
import { VennSvg } from './venn-svg.js';
import { DIAGRAMA_NODE_TYPES } from './diagrama-shape-node.js';
import type { GraphConnectAttempt, GraphNodePositionPatch } from '@lumina/editor-shared/graph-editor';
import { Skeleton } from '@lumina/ui/skeleton';
import { cn } from '@lumina/ui/lib/utils';

const GraphCanvas = dynamic(
  () => import('@lumina/editor-shared/graph-editor').then((mod) => mod.GraphCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-4">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    ),
  },
);

interface DiagramaEditorProps {
  block: DiagramaBlock;
  isSelected?: boolean;
  onEnsureBlockSelected?: () => void;
  onChange?: (updated: DiagramaBlock) => void;
  className?: string;
}

export function DiagramaEditor({
  block,
  isSelected = false,
  onEnsureBlockSelected,
  onChange,
  className,
}: DiagramaEditorProps) {
  const { titulo, descripcionAccesible } = block;
  const isVenn = block.subtipo === 'venn';
  const vennBlock = isVenn ? (block as DiagramaVennBlock) : null;
  const isGrafo = !isVenn;
  const grafoBlock = isGrafo ? (block as DiagramaGrafoBlock) : null;
  const svgRef = useRef<SVGSVGElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{
    id: string;
    texto: string;
    x: number;
    y: number;
  } | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Escuchar eventos desacoplados desde los nodos del canvas (NodeToolbar y doble clic inline)
  useEffect(() => {
    if (!grafoBlock || !onChange) return;

    const handleNodeUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; etiqueta: string; blockId?: string }>).detail;
      if (detail.blockId && detail.blockId !== block.id) return;
      const { id, etiqueta } = detail;
      const nextNodos = grafoBlock.nodos.map((n) =>
        n.id === id ? { ...n, etiqueta } : n,
      );
      onChange({ ...grafoBlock, nodos: nextNodos });
    };

    const handleAddChild = (e: Event) => {
      const detail = (e as CustomEvent<{ parentId: string; blockId?: string }>).detail;
      if (detail.blockId && detail.blockId !== block.id) return;
      const { parentId } = detail;
      const parentNode = grafoBlock.nodos.find((n) => n.id === parentId);
      if (!parentNode) return;

      const count = grafoBlock.nodos.length + 1;
      const maxSeq = grafoBlock.nodos.reduce((max, n) => {
        const seq = Number(n.id.split('-').pop());
        return Number.isFinite(seq) && seq > max ? seq : max;
      }, 0);
      const newNodeId = `nodo-${grafoBlock.subtipo}-${Math.max(count, maxSeq + 1)}`;

      // Posicionar el nuevo hijo cerca del padre con un offset
      const angle = ((grafoBlock.nodos.length * 45) * Math.PI) / 180;
      const offset = 140;
      const newX = Math.round(parentNode.x + offset * Math.cos(angle));
      const newY = Math.round(parentNode.y + offset * Math.sin(angle));

      const parentColor =
        typeof parentNode.estilo?.color === 'string'
          ? parentNode.estilo.color
          : '#2563EB';

      const newNode = {
        id: newNodeId,
        etiqueta: `Nuevo Concepto`,
        x: newX,
        y: newY,
        forma: (grafoBlock.subtipo === 'mapa_mental' ? 'chip' : 'rounded') as import('@lumina/types/slide').DiagramaNodoForma,
        estilo: { color: parentColor },
      };

      const nextEdgeSeq =
        grafoBlock.aristas.reduce((max, a) => {
          const parts = a.id.split('-');
          const seq = Number(parts[parts.length - 1]);
          return Number.isFinite(seq) && seq > max ? seq : max;
        }, grafoBlock.aristas.length) + 1;

      const newArista = {
        id: `arista-${parentId}-${newNodeId}-${nextEdgeSeq}`,
        desdeId: parentId,
        haciaId: newNodeId,
        dirigida: grafoBlock.subtipo === 'flujo' || grafoBlock.subtipo === 'organigrama',
        tipoTrazado: (grafoBlock.subtipo === 'flujo' ? 'smoothstep' : 'bezier') as import('@lumina/types/slide').DiagramaAristaTrazado,
      };

      onChange({
        ...grafoBlock,
        nodos: [...grafoBlock.nodos, newNode],
        aristas: [...grafoBlock.aristas, newArista],
      });
    };

    const handleDeleteNode = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string; blockId?: string }>).detail;
      if (detail.blockId && detail.blockId !== block.id) return;
      const { id } = detail;
      if (grafoBlock.nodos.length <= 1) return;

      const nextNodos = grafoBlock.nodos.filter((n) => n.id !== id);
      const nextAristas = grafoBlock.aristas.filter(
        (a) => a.desdeId !== id && a.haciaId !== id,
      );

      onChange({
        ...grafoBlock,
        nodos: nextNodos,
        aristas: nextAristas,
      });
    };

    window.addEventListener('lumina-diagrama-node-update', handleNodeUpdate);
    window.addEventListener('lumina-diagrama-add-child', handleAddChild);
    window.addEventListener('lumina-diagrama-delete-node', handleDeleteNode);

    return () => {
      window.removeEventListener('lumina-diagrama-node-update', handleNodeUpdate);
      window.removeEventListener('lumina-diagrama-add-child', handleAddChild);
      window.removeEventListener('lumina-diagrama-delete-node', handleDeleteNode);
    };
  }, [block.id, grafoBlock, onChange]);

  const model = useMemo(() => {
    if (!grafoBlock) return { nodes: [], edges: [] };
    return diagramaToGraphModel(grafoBlock);
  }, [grafoBlock]);

  // Arrastre de nodos con debounce (~300ms) (§1.13)
  const handleNodesMove = useCallback(
    (patches: GraphNodePositionPatch[]) => {
      if (!grafoBlock || !onChange) return;

      const patchMap = new Map(patches.map((p) => [p.id, p]));
      const updatedNodos = grafoBlock.nodos.map((n) => {
        const p = patchMap.get(n.id);
        return p ? { ...n, x: Math.round(p.x), y: Math.round(p.y) } : n;
      });

      // Cronología: al soltar, `normalizeDiagramaBlock` re-aplana al eje y
      // reordena por `x`, regenerando la cadena de conectores (layout lineal
      // restringido). El resto de subtipos persiste tal cual.
      const updatedBlock: DiagramaGrafoBlock =
        grafoBlock.subtipo === 'cronologia'
          ? (normalizeDiagramaBlock({
              ...grafoBlock,
              nodos: updatedNodos,
            }) as DiagramaGrafoBlock)
          : { ...grafoBlock, nodos: updatedNodos };

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        onChange(updatedBlock);
      }, 300);
    },
    [grafoBlock, onChange],
  );

  // Conexión entre nodos
  const handleConnect = useCallback(
    (attempt: GraphConnectAttempt) => {
      if (!grafoBlock || !onChange) return;

      // Cronología: los conectores son una cadena secuencial automática; el
      // docente no dibuja aristas.
      if (grafoBlock.subtipo === 'cronologia') return;

      // Evitar aristas duplicadas
      const exists = grafoBlock.aristas.some(
        (a) => a.desdeId === attempt.source && a.haciaId === attempt.target,
      );
      if (exists) return;

      const nextEdgeSeq =
        grafoBlock.aristas.reduce((max, a) => {
          const parts = a.id.split('-');
          const seq = Number(parts[parts.length - 1]);
          return Number.isFinite(seq) && seq > max ? seq : max;
        }, grafoBlock.aristas.length) + 1;

      const newArista = {
        id: `arista-${attempt.source}-${attempt.target}-${nextEdgeSeq}`,
        desdeId: attempt.source,
        haciaId: attempt.target,
        dirigida: grafoBlock.subtipo === 'flujo',
      };

      const updatedBlock: DiagramaGrafoBlock = {
        ...grafoBlock,
        aristas: [...grafoBlock.aristas, newArista],
      };

      onChange(updatedBlock);
    },
    [grafoBlock, onChange],
  );

  const handleVennChipDown = useCallback(
    (elementoId: string, event: React.PointerEvent) => {
      if (!isSelected || !vennBlock) return;
      event.stopPropagation();
      event.preventDefault();
      const el = vennBlock.elementos.find((item) => item.id === elementoId);
      if (!el) return;
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      setDrag({ id: elementoId, texto: el.texto, x: event.clientX, y: event.clientY });
    },
    [isSelected, vennBlock],
  );

  const handleVennPointerMove = useCallback((event: React.PointerEvent) => {
    if (!drag) return;
    event.stopPropagation();
    setDrag((prev) => (prev ? { ...prev, x: event.clientX, y: event.clientY } : prev));
  }, [drag]);

  const handleVennPointerUp = useCallback(
    (event: React.PointerEvent) => {
      if (!drag || !vennBlock || !onChange) {
        setDrag(null);
        return;
      }
      event.stopPropagation();
      const tray = trayRef.current;
      let inTray = false;
      if (tray) {
        const r = tray.getBoundingClientRect();
        inTray =
          event.clientX >= r.left &&
          event.clientX <= r.right &&
          event.clientY >= r.top &&
          event.clientY <= r.bottom;
      }
      let regionId: string | null = null;
      if (!inTray && svgRef.current) {
        const svg = svgRef.current;
        const pt = svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        const ctm = svg.getScreenCTM();
        if (ctm) {
          const local = pt.matrixTransform(ctm.inverse());
          regionId = regionAtPoint(local.x, local.y, vennBlock.conjuntos);
        }
      }
      const next = normalizeDiagramaBlock({
        ...vennBlock,
        elementos: assignElementoRegion(vennBlock.elementos, drag.id, regionId),
      });
      onChange(next);
      setDrag(null);
    },
    [drag, vennBlock, onChange],
  );

  return (
    <div
      onClick={onEnsureBlockSelected}
      onPointerMove={drag ? handleVennPointerMove : undefined}
      onPointerUp={drag ? handleVennPointerUp : undefined}
      className={cn(
        'relative flex h-full w-full select-none flex-col overflow-hidden rounded-lg bg-background/50 border border-border/40 p-2 shadow-xs',
        isSelected && 'ring-2 ring-primary/40',
        className,
      )}
    >
      {titulo && (
        <div className="px-2 pt-1 pb-1.5 text-center text-sm font-semibold tracking-tight text-foreground">
          {titulo}
        </div>
      )}

      {descripcionAccesible && (
        <div className="sr-only" aria-live="polite">
          {descripcionAccesible}
        </div>
      )}

      <div
        className={cn(
          'relative min-h-0 flex-1 w-full overflow-hidden rounded-md',
          !isSelected && 'pointer-events-none',
        )}
      >
        {isVenn && vennBlock && (
          <VennSvg
            block={vennBlock}
            isSelected={isSelected}
            draggingId={drag?.id ?? null}
            svgRef={svgRef}
            trayRef={trayRef}
            onChipPointerDown={handleVennChipDown}
          />
        )}
        {isGrafo && grafoBlock && (
          <GraphCanvas
            model={model}
            interactive={isSelected}
            positionAuthority={
              grafoBlock.subtipo === 'cronologia' ? 'model' : 'rf'
            }
            nodeTypes={DIAGRAMA_NODE_TYPES}
            onNodesMove={handleNodesMove}
            onConnect={handleConnect}
            fitView={false}
            showControls={isSelected}
            showMiniMap={false}
            showBackground={true}
          />
        )}
      </div>
      {drag && (
        <span
          className="pointer-events-none fixed z-50 rounded-full border border-primary bg-background px-1.5 py-0.5 text-[10px] font-medium shadow-md"
          style={{ left: drag.x + 8, top: drag.y + 8 }}
        >
          {drag.texto}
        </span>
      )}
    </div>
  );
}
