'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import type { GraficoDatosBlock } from '@/types/slide.types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const GraficoChartRenderer = dynamic(
  () => import('./grafico-chart-renderer'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center p-4">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    ),
  },
);

interface GraficoViewerProps {
  block: GraficoDatosBlock;
  isThumbnail?: boolean;
  className?: string;
}

export function GraficoViewer({
  block,
  isThumbnail = false,
  className,
}: GraficoViewerProps) {
  const { titulo, descripcionAccesible, categorias, series } = block;

  const hasData = categorias.length > 0 && series.length > 0;

  return (
    <figure
      role="region"
      aria-label={titulo || 'Gráfico de datos'}
      className={cn(
        'relative flex h-full w-full flex-col overflow-hidden rounded-lg bg-background/50 p-2 shadow-xs border border-border/40',
        className,
      )}
    >
      {titulo && !isThumbnail && (
        <figcaption className="px-2 pt-1 pb-2 text-center text-sm font-semibold tracking-tight text-foreground">
          {titulo}
        </figcaption>
      )}

      {descripcionAccesible && (
        <div className="sr-only" aria-live="polite">
          {descripcionAccesible}
        </div>
      )}

      <div className="relative min-h-0 flex-1 w-full">
        {hasData ? (
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center p-2">
                <Skeleton className="h-full w-full rounded-lg" />
              </div>
            }
          >
            <GraficoChartRenderer block={block} isThumbnail={isThumbnail} />
          </Suspense>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            Gráfico sin datos
          </div>
        )}
      </div>
    </figure>
  );
}
