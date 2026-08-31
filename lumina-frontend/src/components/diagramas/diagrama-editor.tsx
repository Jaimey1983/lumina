'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { DiagramaBlock, DiagramaGrafoBlock, DiagramaVennBlock } from '@/types/slide.types';
import { applyGraphModelToDiagrama, diagramaToGraphModel } from './diagrama-bridge';
import { normalizeDiagramaBlock } from './diagrama-defaults';
import { assignElementoRegion, regionAtPoint } from './diagrama-regions';
import { VennSvg } from './venn-svg';
import type { GraphConnectAttempt, GraphNodePositionPatch } from '@/lib/graph-editor';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const GraphCanvas = dynamic(
  () => import('@/lib/graph-editor').then((mod) => mod.GraphCanvas),
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

      const newArista = {
        id: `arista-${attempt.source}-${attempt.target}-${Date.now()}`,
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
