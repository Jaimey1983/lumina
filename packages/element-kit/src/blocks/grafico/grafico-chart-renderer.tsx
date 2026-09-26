'use client';

import React, { useMemo } from 'react';
import { LuminaChart, type LuminaChartConfig } from '@lumina/charts';
import type { GraficoDatosBlock } from '@lumina/types/slide';

interface GraficoChartRendererProps {
  block: GraficoDatosBlock;
}

/**
 * Adapter de `GraficoDatosBlock` (contrato del elemento, E4.1) al vocabulario
 * de `@lumina/charts` (Etapa H, H3). `titulo`/`descripcionAccesible` no se
 * pasan acá — `GraficoViewer` ya los renderiza fuera del chart (`<figcaption>`
 * + región `aria-live` propia); pasarlos también acá duplicaría el anuncio.
 */
export default function GraficoChartRenderer({
  block,
}: GraficoChartRendererProps) {
  const config = useMemo<LuminaChartConfig>(
    () => ({
      type: block.chartType,
      categorias: block.categorias,
      series: block.series,
      paletaId: block.colorPaleta,
      mostrarLeyenda: block.mostrarLeyenda,
      apilado: block.apilado,
      ejeXTitulo: block.ejeXTitulo,
      ejeYTitulo: block.ejeYTitulo,
      ejeYMin: block.ejeYMin,
      ejeYMax: block.ejeYMax,
      ejeYEscalaLog: block.ejeYEscalaLog,
      mostrarEtiquetasDatos: block.mostrarEtiquetasDatos,
      lineasReferencia: block.lineasReferencia,
      animar: block.animar,
      ordenDatos: block.ordenDatos,
      exportarImagen: block.exportarImagen,
      curva: block.curva,
      modoSparkline: block.modoSparkline,
      mostrarTotal: block.mostrarTotal,
      angulo: block.angulo,
      anguloInicio: block.anguloInicio,
      anguloFin: block.anguloFin,
      histogramBins: block.histogramBins,
      formatoValor: block.formatoValor,
      ejeXRotacion: block.ejeXRotacion,
      ejeXOculto: block.ejeXOculto,
      ejeYOculto: block.ejeYOculto,
      grillas: block.grillas,
      posicionLeyenda: block.posicionLeyenda,
      bandas: block.bandas,
      estilo: block.estilo,
      paletaPersonalizada: block.paletaPersonalizada,
    }),
    [
      block.chartType,
      block.categorias,
      block.series,
      block.colorPaleta,
      block.mostrarLeyenda,
      block.apilado,
      block.ejeXTitulo,
      block.ejeYTitulo,
      block.ejeYMin,
      block.ejeYMax,
      block.ejeYEscalaLog,
      block.mostrarEtiquetasDatos,
      block.lineasReferencia,
      block.animar,
      block.ordenDatos,
      block.exportarImagen,
      block.curva,
      block.modoSparkline,
      block.mostrarTotal,
      block.angulo,
      block.anguloInicio,
      block.anguloFin,
      block.histogramBins,
      block.formatoValor,
      block.ejeXRotacion,
      block.ejeXOculto,
      block.ejeYOculto,
      block.grillas,
      block.posicionLeyenda,
      block.bandas,
      block.estilo,
      block.paletaPersonalizada,
    ],
  );

  return <LuminaChart config={config} />;
}
