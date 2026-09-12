'use client';

import React, { useMemo } from 'react';
import { LuminaChart, type LuminaChartConfig } from '@lumina/charts';
import type { GraficoDatosBlock } from '@lumina/types/slide';

interface GraficoChartRendererProps {
  block: GraficoDatosBlock;
  isThumbnail?: boolean;
}

/**
 * Adapter de `GraficoDatosBlock` (contrato del elemento, E4.1) al vocabulario
 * de `@lumina/charts` (Etapa H, H3). `titulo`/`descripcionAccesible` no se
 * pasan acá — `GraficoViewer` ya los renderiza fuera del chart (`<figcaption>`
 * + región `aria-live` propia); pasarlos también acá duplicaría el anuncio.
 */
export default function GraficoChartRenderer({
  block,
  isThumbnail = false,
}: GraficoChartRendererProps) {
  const config = useMemo<LuminaChartConfig>(
    () => ({
      type: block.chartType,
      categorias: block.categorias,
      series: block.series,
      paletaId: block.colorPaleta,
      mostrarLeyenda: block.mostrarLeyenda,
      isThumbnail,
    }),
    [block.chartType, block.categorias, block.series, block.colorPaleta, block.mostrarLeyenda, isThumbnail],
  );

  return <LuminaChart config={config} />;
}
