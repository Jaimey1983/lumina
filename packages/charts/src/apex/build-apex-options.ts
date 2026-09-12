// ─── Adapter interno: LuminaChartConfig → opciones de ApexCharts ───────────
// Único archivo que conoce la forma real de `apexcharts`. Nada fuera de
// `chart-container.tsx` debe importar esto — es implementación, no contrato
// (ver decisión de motor en AGENTS.md, Etapa H).

import type { ApexOptions } from 'apexcharts';
import { getSeriesColor } from '../palettes.js';
import type { LuminaChartTheme } from '../chart-theme.js';
import type { LuminaChartConfig } from '../types.js';

export type BuiltApexChartType =
  | 'bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'radialBar'
  | 'scatter'
  | 'bubble'
  | 'radar'
  | 'treemap'
  | 'heatmap';

export type ApexCartesianSeries = Array<{
  name?: string;
  type?: 'column' | 'line' | 'area' | 'bar';
  data: unknown[];
}>;

export type ApexCircularSeries = number[];

export interface BuiltApexChart {
  chartType: BuiltApexChartType;
  series: ApexCartesianSeries | ApexCircularSeries;
  options: ApexOptions;
}

function baseChartOptions(config: LuminaChartConfig, theme: LuminaChartTheme): ApexOptions['chart'] {
  const isStacked = config.apilado === 'normal' || config.apilado === 'porcentaje';
  const showToolbar = (config.exportarImagen !== undefined ? config.exportarImagen : true) && !config.isThumbnail;

  return {
    fontFamily: 'inherit',
    foreColor: theme.foreColor,
    background: 'transparent',
    toolbar: { show: showToolbar },
    animations: { enabled: Boolean(config.animar) },
    zoom: { enabled: false },
    stacked: isStacked,
    stackType: config.apilado === 'porcentaje' ? '100%' : 'normal',
  };
}

function buildDataLabels(config: LuminaChartConfig, defaultEnabled = false): ApexOptions['dataLabels'] {
  if (config.isThumbnail || config.type === 'radialBar') {
    return { enabled: false };
  }
  const enabled = config.mostrarEtiquetasDatos !== undefined
    ? Boolean(config.mostrarEtiquetasDatos)
    : defaultEnabled;
  return { enabled };
}

function buildAnnotations(config: LuminaChartConfig, theme: LuminaChartTheme): ApexOptions['annotations'] | undefined {
  if (!config.lineaReferencia) return undefined;
  return {
    yaxis: [
      {
        y: config.lineaReferencia.valor,
        borderColor: theme.mutedColor,
        strokeDashArray: 4,
        label: {
          text: config.lineaReferencia.etiqueta ?? `Meta: ${config.lineaReferencia.valor}`,
          style: {
            color: theme.foreColor,
            background: theme.borderColor,
            fontSize: '10px',
          },
        },
      },
    ],
  };
}

function buildXAxis(config: LuminaChartConfig, theme: LuminaChartTheme, isNumeric = false): ApexOptions['xaxis'] {
  return {
    ...(isNumeric ? { type: 'numeric' } : { categories: config.categorias }),
    ...(config.ejeXTitulo
      ? {
          title: {
            text: config.ejeXTitulo,
            style: { fontSize: config.isThumbnail ? '8px' : '11px', color: theme.mutedColor },
          },
        }
      : {}),
    labels: {
      style: { fontSize: config.isThumbnail ? '8px' : '11px', colors: theme.mutedColor },
    },
  };
}

function buildYAxis(config: LuminaChartConfig, theme: LuminaChartTheme): ApexOptions['yaxis'] {
  const hasSecondary = config.type === 'combo' && config.series.some((s) => s.ejeCombo === 'secundario');

  const primaryY: Record<string, unknown> = {
    labels: {
      style: { fontSize: config.isThumbnail ? '8px' : '11px', colors: theme.mutedColor },
    },
  };

  if (config.ejeYTitulo) {
    primaryY.title = {
      text: config.ejeYTitulo,
      style: { fontSize: config.isThumbnail ? '8px' : '11px', color: theme.mutedColor },
    };
  }
  if (config.ejeYMin !== undefined) {
    primaryY.min = config.ejeYMin;
  }
  if (config.ejeYMax !== undefined) {
    primaryY.max = config.ejeYMax;
  }
  if (config.ejeYEscalaLog) {
    primaryY.logarithmic = true;
  }

  if (!hasSecondary) {
    return primaryY as ApexOptions['yaxis'];
  }

  const secondaryY: Record<string, unknown> = {
    opposite: true,
    title: {
      text: 'Secundario',
      style: { fontSize: config.isThumbnail ? '8px' : '11px', color: theme.mutedColor },
    },
    labels: {
      style: { fontSize: config.isThumbnail ? '8px' : '11px', colors: theme.mutedColor },
    },
  };

  return [primaryY, secondaryY] as ApexOptions['yaxis'];
}

function applyDataOrdering(config: LuminaChartConfig): LuminaChartConfig {
  if (!config.ordenDatos || config.ordenDatos === 'como-esta') {
    return config;
  }
  const factor = config.ordenDatos === 'ascendente' ? 1 : -1;

  if (config.type === 'scatter' || config.type === 'bubble') {
    const nextSeries = config.series.map((s) => {
      if (!s.puntos || s.puntos.length === 0) return s;
      const sorted = [...s.puntos].sort((a, b) => (a.x - b.x) * factor);
      return { ...s, puntos: sorted };
    });
    return { ...config, series: nextSeries };
  }

  if (!config.categorias || config.categorias.length === 0 || !config.series || config.series.length === 0) {
    return config;
  }

  const primary = config.series[0];
  const indices = config.categorias.map((_, i) => i);
  indices.sort((a, b) => {
    const valA = primary?.valores?.[a] ?? 0;
    const valB = primary?.valores?.[b] ?? 0;
    return (valA - valB) * factor;
  });

  const nextCategorias = indices.map((i) => config.categorias[i]);
  const nextSeries = config.series.map((s) => ({
    ...s,
    valores: indices.map((i) => s.valores[i] ?? 0),
  }));

  return { ...config, categorias: nextCategorias, series: nextSeries };
}

function buildCartesianChart(config: LuminaChartConfig, theme: LuminaChartTheme): BuiltApexChart {
  const isCombo = config.type === 'combo';
  const usesApexBarRenderer = config.type === 'bar' || config.type === 'column';
  const isHorizontalBar = config.type === 'bar';
  const apexChartType: BuiltApexChartType = isCombo
    ? 'line'
    : usesApexBarRenderer
      ? 'bar'
      : (config.type as 'line' | 'area');

  const colors = config.series.map((s, idx) => getSeriesColor(idx, config.paletaId, s.color));

  const series: ApexCartesianSeries = isCombo
    ? config.series.map((s) => ({
        name: s.nombre,
        type: s.tipoCombo ?? 'column',
        data: s.valores,
      }))
    : config.series.map((s) => ({ name: s.nombre, data: s.valores }));

  const stroke = isCombo
    ? { width: config.series.map((s) => (s.tipoCombo === 'line' ? 2 : 0)), curve: 'smooth' as const }
    : config.type === 'line' || config.type === 'area'
      ? { curve: 'smooth' as const, width: 2 }
      : { width: 0 };

  const fill =
    config.type === 'area'
      ? { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.05 } }
      : { opacity: 1 };

  const options: ApexOptions = {
    chart: { ...baseChartOptions(config, theme), type: apexChartType },
    colors,
    xaxis: buildXAxis(config, theme),
    yaxis: buildYAxis(config, theme),
    grid: { borderColor: theme.borderColor, strokeDashArray: 3 },
    legend: {
      show: Boolean(config.mostrarLeyenda) && !config.isThumbnail,
      position: 'bottom',
      fontSize: '11px',
      labels: { colors: theme.foreColor },
    },
    tooltip: { enabled: !config.isThumbnail },
    dataLabels: buildDataLabels(config, false),
    stroke,
    fill,
    ...(buildAnnotations(config, theme) ? { annotations: buildAnnotations(config, theme) } : {}),
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

function buildScatterOrBubbleChart(config: LuminaChartConfig, theme: LuminaChartTheme): BuiltApexChart {
  const chartType = config.type as 'scatter' | 'bubble';
  const colors = config.series.map((s, idx) => getSeriesColor(idx, config.paletaId, s.color));

  const series: ApexCartesianSeries = config.series.map((s) => {
    if (chartType === 'scatter') {
      return {
        name: s.nombre,
        data: (s.puntos ?? []).map((p) => [p.x, p.y]),
      };
    }
    return {
      name: s.nombre,
      data: (s.puntos ?? []).map((p) => [p.x, p.y, p.z ?? 10]),
    };
  });

  const options: ApexOptions = {
    chart: { ...baseChartOptions(config, theme), type: chartType },
    colors,
    xaxis: buildXAxis(config, theme, true),
    yaxis: buildYAxis(config, theme),
    grid: { borderColor: theme.borderColor, strokeDashArray: 3 },
    legend: {
      show: Boolean(config.mostrarLeyenda) && !config.isThumbnail,
      position: 'bottom',
      fontSize: '11px',
      labels: { colors: theme.foreColor },
    },
    tooltip: { enabled: !config.isThumbnail },
    dataLabels: buildDataLabels(config, false),
    ...(buildAnnotations(config, theme) ? { annotations: buildAnnotations(config, theme) } : {}),
  };

  return { chartType, series, options };
}

function buildRadarChart(config: LuminaChartConfig, theme: LuminaChartTheme): BuiltApexChart {
  const colors = config.series.map((s, idx) => getSeriesColor(idx, config.paletaId, s.color));
  const series: ApexCartesianSeries = config.series.map((s) => ({ name: s.nombre, data: s.valores }));

  const options: ApexOptions = {
    chart: { ...baseChartOptions(config, theme), type: 'radar' },
    colors,
    xaxis: {
      categories: config.categorias,
      labels: { style: { fontSize: config.isThumbnail ? '8px' : '11px', colors: theme.mutedColor } },
    },
    yaxis: { show: false },
    legend: {
      show: Boolean(config.mostrarLeyenda) && !config.isThumbnail,
      position: 'bottom',
      fontSize: '11px',
      labels: { colors: theme.foreColor },
    },
    tooltip: { enabled: !config.isThumbnail },
    dataLabels: buildDataLabels(config, false),
    stroke: { width: 2 },
    markers: { size: 3 },
  };

  return { chartType: 'radar', series, options };
}

function buildTreemapChart(config: LuminaChartConfig, theme: LuminaChartTheme): BuiltApexChart {
  const primary = config.series[0];
  const colors = config.categorias.map((_, idx) => getSeriesColor(idx, config.paletaId));
  const data = config.categorias.map((cat, idx) => ({
    x: cat,
    y: primary?.valores[idx] ?? 0,
  }));

  const series: ApexCartesianSeries = [{ data }];

  const options: ApexOptions = {
    chart: { ...baseChartOptions(config, theme), type: 'treemap' },
    colors,
    legend: { show: false },
    tooltip: { enabled: !config.isThumbnail },
    dataLabels: buildDataLabels(config, true),
    plotOptions: {
      treemap: {
        distributed: true,
        enableShades: false,
      },
    },
  };

  return { chartType: 'treemap', series, options };
}

function buildFunnelChart(config: LuminaChartConfig, theme: LuminaChartTheme): BuiltApexChart {
  const primary = config.series[0];
  const colors = config.categorias.map((_, idx) => getSeriesColor(idx, config.paletaId));
  const data = config.categorias.map((_, idx) => primary?.valores[idx] ?? 0);

  const series: ApexCartesianSeries = [{ name: primary?.nombre || 'Etapas', data }];

  const options: ApexOptions = {
    chart: { ...baseChartOptions(config, theme), type: 'bar' },
    colors,
    xaxis: buildXAxis(config, theme),
    yaxis: buildYAxis(config, theme),
    grid: { borderColor: theme.borderColor, strokeDashArray: 3 },
    legend: { show: false },
    tooltip: { enabled: !config.isThumbnail },
    dataLabels: buildDataLabels(config, true),
    ...(buildAnnotations(config, theme) ? { annotations: buildAnnotations(config, theme) } : {}),
    plotOptions: {
      bar: {
        horizontal: true,
        isFunnel: true,
        borderRadius: 0,
        distributed: true,
      },
    },
  };

  return { chartType: 'bar', series, options };
}

function buildHeatmapChart(config: LuminaChartConfig, theme: LuminaChartTheme): BuiltApexChart {
  const colors = [getSeriesColor(0, config.paletaId)];
  const series: ApexCartesianSeries = config.series.map((s) => ({
    name: s.nombre,
    data: config.categorias.map((cat, idx) => ({
      x: cat,
      y: s.valores[idx] ?? 0,
    })),
  }));

  const options: ApexOptions = {
    chart: { ...baseChartOptions(config, theme), type: 'heatmap' },
    colors,
    xaxis: buildXAxis(config, theme),
    yaxis: buildYAxis(config, theme),
    grid: { borderColor: theme.borderColor, strokeDashArray: 3 },
    legend: {
      show: Boolean(config.mostrarLeyenda) && !config.isThumbnail,
      position: 'bottom',
      fontSize: '11px',
      labels: { colors: theme.foreColor },
    },
    tooltip: { enabled: !config.isThumbnail },
    dataLabels: buildDataLabels(config, false),
    plotOptions: {
      heatmap: {
        radius: 2,
        enableShades: true,
      },
    },
  };

  return { chartType: 'heatmap', series, options };
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
    dataLabels: buildDataLabels(config, config.type !== 'radialBar'),
    plotOptions:
      config.type === 'radialBar'
        ? { radialBar: { hollow: { size: '30%' } } }
        : config.type === 'donut'
          ? { pie: { donut: { size: '65%' } } }
          : undefined,
  };

  return { chartType: config.type as 'pie' | 'donut' | 'radialBar', series: values, options };
}

export function buildApexChart(rawConfig: LuminaChartConfig, theme: LuminaChartTheme): BuiltApexChart {
  const config = applyDataOrdering(rawConfig);

  switch (config.type) {
    case 'column':
    case 'bar':
    case 'line':
    case 'area':
    case 'combo':
      return buildCartesianChart(config, theme);
    case 'scatter':
    case 'bubble':
      return buildScatterOrBubbleChart(config, theme);
    case 'radar':
      return buildRadarChart(config, theme);
    case 'treemap':
      return buildTreemapChart(config, theme);
    case 'funnel':
      return buildFunnelChart(config, theme);
    case 'heatmap':
      return buildHeatmapChart(config, theme);
    case 'pie':
    case 'donut':
    case 'radialBar':
      return buildCircularChart(config, theme);
    default:
      return buildCartesianChart({ ...config, type: 'column' }, theme);
  }
}
