'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { DiagramaBlock, DiagramaGrafoBlock, DiagramaVennBlock } from '@/types/slide.types';
import { diagramaToGraphModel } from './diagrama-bridge';
import { VennSvg } from './venn-svg';
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

interface DiagramaViewerProps {
  block: DiagramaBlock;
  isThumbnail?: boolean;
  className?: string;
}

export function DiagramaViewer({
  block,
  isThumbnail = false,
  className,
}: DiagramaViewerProps) {
  const { titulo, descripcionAccesible } = block;

  const isVenn = block.subtipo === 'venn';
  const vennBlock = isVenn ? (block as DiagramaVennBlock) : null;
  const isGrafo = !isVenn;
  const grafoBlock = isGrafo ? (block as DiagramaGrafoBlock) : null;

  const model = useMemo(() => {
    if (!grafoBlock) return { nodes: [], edges: [] };
    return diagramaToGraphModel(grafoBlock);
  }, [grafoBlock]);

  return (
    <figure
      role="region"
      aria-label={titulo || 'Diagrama'}
      className={cn(
        'relative flex h-full w-full flex-col overflow-hidden rounded-lg bg-background/50 p-2 shadow-xs border border-border/40',
        className,
      )}
    >
      {titulo && !isThumbnail && (
        <figcaption className="px-2 pt-1 pb-1.5 text-center text-sm font-semibold tracking-tight text-foreground">
          {titulo}
        </figcaption>
      )}

      {descripcionAccesible && (
        <div className="sr-only" aria-live="polite">
          {descripcionAccesible}
        </div>
      )}

      <div className="relative min-h-0 flex-1 w-full overflow-hidden rounded-md">
        {isVenn && vennBlock ? (
          <VennSvg block={vennBlock} />
        ) : isGrafo && grafoBlock && grafoBlock.nodos.length > 0 ? (
          <GraphCanvas
            model={model}
            interactive={false}
            positionAuthority={
              grafoBlock.subtipo === 'cronologia' ? 'model' : 'rf'
            }
            fitView={true}
            showControls={false}
            showMiniMap={false}
            showBackground={!isThumbnail}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            Diagrama sin datos
          </div>
        )}
      </div>
    </figure>
  );
}
