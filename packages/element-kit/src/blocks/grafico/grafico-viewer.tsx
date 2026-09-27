'use client';

import React from 'react';
import type { GraficoDatosBlock } from '@lumina/types/slide';
import { cn } from '@lumina/ui/lib/utils';
// `GraficoChartRenderer` ya no necesita cargarse perezoso desde acá (H3): es
// un adapter liviano — la carga perezosa real de la librería de gráficos vive
// dentro de `<LuminaChart>` (`@lumina/charts`), un solo lugar para toda la app.
import GraficoChartRenderer from './grafico-chart-renderer.js';

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
          <GraficoChartRenderer block={block} isThumbnail={isThumbnail} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            Gráfico sin datos
          </div>
        )}
      </div>
    </figure>
  );
}
