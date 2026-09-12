// ─── Adapter interno: LuminaChartConfig → opciones de ApexCharts ───────────
// Único archivo que conoce la forma real de `apexcharts`. Nada fuera de
// `chart-container.tsx` debe importar esto — es implementación, no contrato
// (ver decisión de motor en AGENTS.md, Etapa H).

import type { ApexOptions } from 'apexcharts';
import { getSeriesColor } from '../palettes.js';
import type { LuminaChartTheme } from '../chart-theme.js';
import type { LuminaChartConfig } from '../types.js';

export type ApexCartesianSeries = Array<{ name: string; data: number[] }>;
export type ApexCircularSeries = number[];

export interface BuiltApexChart {
  chartType: 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'radialBar';
  series: ApexCartesianSeries | ApexCircularSeries;
  options: ApexOptions;
}

const CARTESIAN_TYPES = new Set<LuminaChartConfig['type']>(['column', 'bar', 'line', 'area']);
const CIRCULAR_TYPES = new Set<LuminaChartConfig['type']>(['pie', 'donut', 'radialBar']);

function baseChartOptions(config: LuminaChartConfig, theme: LuminaChartTheme): ApexOptions['chart'] {
  return {
    fontFamily: 'inherit',
    foreColor: theme.foreColor,
    background: 'transparent',
    toolbar: { show: !config.isThumbnail },
    // Animación deshabilitada siempre (no solo en miniatura), no solo por gusto:
    // la entrada animada de ApexCharts hace que la geometría real del SVG sea
    // dependiente del instante exacto de captura — no hay un DOM "final"
    // determinista mientras la transición corre. Habilitarla es una decisión
    // de catálogo/configuración (H6), no de este swap de motor (H3).
    animations: { enabled: false },
    zoom: { enabled: false },
  };
}

function buildCartesianChart(config: LuminaChartConfig, theme: LuminaChartTheme): BuiltApexChart {
  const usesApexBarRenderer = config.type === 'bar' || config.type === 'column';
  const isHorizontalBar = config.type === 'bar';
  const apexChartType: 'bar' | 'line' | 'area' = usesApexBarRenderer
    ? 'bar'
    : (config.type as 'line' | 'area');
  const colors = config.series.map((s, idx) => getSeriesColor(idx, config.paletaId, s.color));

  const series: ApexCartesianSeries = config.series.map((s) => ({ name: s.nombre, data: s.valores }));

  const options: ApexOptions = {
    chart: { ...baseChartOptions(config, theme), type: apexChartType },
    colors,
    xaxis: {
      categories: config.categorias,
      labels: { style: { fontSize: config.isThumbnail ? '8px' : '11px', colors: theme.mutedColor } },
    },
    yaxis: {
      labels: { style: { fontSize: config.isThumbnail ? '8px' : '11px', colors: theme.mutedColor } },
    },
    grid: { borderColor: theme.borderColor, strokeDashArray: 3 },
    legend: {
      show: Boolean(config.mostrarLeyenda) && !config.isThumbnail,
      position: 'bottom',
      fontSize: '11px',
      labels: { colors: theme.foreColor },
    },
    tooltip: { enabled: !config.isThumbnail },
    dataLabels: { enabled: false },
    stroke: config.type === 'line' || config.type === 'area' ? { curve: 'smooth', width: 2 } : { width: 0 },
    fill:
      config.type === 'area'
        ? { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.05 } }
        : { opacity: 1 },
    plotOptions: {
      bar: {
        horizontal: isHorizontalBar,
        borderRadius: 4,
        columnWidth: '60%',
      },
    },
  };

  return { chartType: apexChartType, series, options };
}

function buildCircularChart(config: LuminaChartConfig, theme: LuminaChartTheme): BuiltApexChart {
  const primary = config.series[0];
  const values = config.categorias.map((_, idx) => primary?.valores[idx] ?? 0);
  const colors = config.categorias.map((_, idx) => getSeriesColor(idx, config.paletaId));

  const options: ApexOptions = {
    chart: { ...baseChartOptions(config, theme), type: config.type as 'pie' | 'donut' | 'radialBar' },
    colors,
    labels: config.categorias,
    legend: {
      show: Boolean(config.mostrarLeyenda) && !config.isThumbnail,
      position: config.type === 'radialBar' ? 'right' : 'bottom',
      fontSize: '11px',
      labels: { colors: theme.foreColor },
    },
    tooltip: { enabled: !config.isThumbnail },
    dataLabels: { enabled: !config.isThumbnail && config.type !== 'radialBar' },
    plotOptions:
      config.type === 'radialBar'
        ? { radialBar: { hollow: { size: '30%' } } }
        : config.type === 'donut'
          ? { pie: { donut: { size: '65%' } } }
          : undefined,
  };

  return { chartType: config.type as 'pie' | 'donut' | 'radialBar', series: values, options };
}

export function buildApexChart(config: LuminaChartConfig, theme: LuminaChartTheme): BuiltApexChart {
  if (CARTESIAN_TYPES.has(config.type)) {
    return buildCartesianChart(config, theme);
  }
  if (CIRCULAR_TYPES.has(config.type)) {
    return buildCircularChart(config, theme);
  }
  // Tipo desconocido (no debería ocurrir: LuminaChartType es cerrado) — column como red de seguridad.
  return buildCartesianChart({ ...config, type: 'column' }, theme);
}
