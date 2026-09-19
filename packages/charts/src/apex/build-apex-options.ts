// ─── Adapter interno: LuminaChartConfig → opciones de ApexCharts ───────────
// Único archivo que conoce la forma real de `apexcharts`. Nada fuera de
// `chart-container.tsx` debe importar esto — es implementación, no contrato
// (ver decisión de motor en AGENTS.md, Etapa H).

import type { ApexOptions } from 'apexcharts';
import { getSeriesColor } from '../palettes.js';
import type { LuminaChartTheme } from '../chart-theme.js';
import type { LuminaChartConfig } from '../types.js';
import { computeHistogramBins, sanitizeHistogramBinCount } from '../histogram.js';
import { formatChartValue } from '../format.js';

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
  | 'heatmap'
  | 'polarArea'
  | 'boxPlot';

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
  const isSparkline = Boolean(config.modoSparkline);
  const showToolbar =
    (config.exportarImagen !== undefined ? config.exportarImagen : true) &&
    !config.isThumbnail &&
    !isSparkline;
  const estilo = config.estilo;

  return {
    fontFamily: estilo?.fuente || 'inherit',
    foreColor: theme.foreColor,
    background: estilo?.fondo === 'tarjeta' ? theme.surfaceColor : 'transparent',
    toolbar: { show: showToolbar },
    animations: {
      enabled: Boolean(config.animar),
      ...(config.animar && estilo?.duracionAnimacion !== undefined ? { speed: estilo.duracionAnimacion } : {}),
    },
    zoom: { enabled: false },
    sparkline: { enabled: isSparkline },
    stacked: isStacked,
    stackType: config.apilado === 'porcentaje' ? '100%' : 'normal',
    dropShadow: estilo?.sombra
      ? { enabled: true, top: 2, left: 0, blur: 4, opacity: 0.15 }
      : { enabled: false },
  };
}

/**
 * Resuelve el color de una serie/categoría (Etapa I5): color explícito de la
 * serie/punto > `paletaPersonalizada` (indexada) > `getSeriesColor` (paleta
 * con id, comportamiento previo a I5).
 */
function resolveColor(idx: number, config: LuminaChartConfig, explicitColor?: string): string {
  if (explicitColor && explicitColor.trim().length > 0) {
    return explicitColor;
  }
  if (config.paletaPersonalizada && config.paletaPersonalizada.length > 0) {
    return config.paletaPersonalizada[idx % config.paletaPersonalizada.length];
  }
  return getSeriesColor(idx, config.paletaId);
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

/**
 * Anotaciones del eje Y (Etapa I5): cero o más líneas de referencia +
 * cero o más bandas sombreadas. `undefined` si no hay ninguna (mismo
 * comportamiento que la versión previa a I5, un solo `lineaReferencia`).
 */
function buildAnnotations(config: LuminaChartConfig, theme: LuminaChartTheme): ApexOptions['annotations'] | undefined {
  const lineas = config.lineasReferencia ?? [];
  const bandas = config.bandas ?? [];
  if (lineas.length === 0 && bandas.length === 0) return undefined;

  const yaxis: NonNullable<ApexOptions['annotations']>['yaxis'] = [
    ...bandas.map((banda) => ({
      y: banda.desde,
      y2: banda.hasta,
      fillColor: banda.color ?? theme.mutedColor,
      opacity: 0.15,
      ...(banda.etiqueta
        ? {
            label: {
              text: banda.etiqueta,
              style: { color: theme.foreColor, background: theme.borderColor, fontSize: '10px' },
            },
          }
        : {}),
    })),
    ...lineas.map((linea) => ({
      y: linea.valor,
      borderColor: linea.color ?? theme.mutedColor,
      strokeDashArray: 4,
      label: {
        text: linea.etiqueta ?? `Meta: ${linea.valor}`,
        style: {
          color: theme.foreColor,
          background: theme.borderColor,
          fontSize: '10px',
        },
      },
    })),
  ];

  return { yaxis };
}

/**
 * Grilla compartida por los tipos cartesianos/afines. `grillas` (Etapa I4)
 * controla qué líneas se muestran; `modoSparkline` (I2) sigue ocultándola
 * entera, igual que antes.
 */
function buildGrid(config: LuminaChartConfig, theme: LuminaChartTheme): ApexOptions['grid'] {
  const grillas = config.grillas ?? 'ambas';
  return {
    show: !config.modoSparkline,
    borderColor: theme.borderColor,
    strokeDashArray: 3,
    xaxis: { lines: { show: grillas === 'ambas' } },
    yaxis: { lines: { show: grillas === 'ambas' || grillas === 'y' } },
  };
}

const LEGEND_POSITION_MAP: Record<NonNullable<LuminaChartConfig['posicionLeyenda']>, 'top' | 'bottom' | 'left' | 'right'> = {
  arriba: 'top',
  abajo: 'bottom',
  izquierda: 'left',
  derecha: 'right',
};

/** Resuelve la posición de leyenda pedida por `posicionLeyenda` (I4), o `fallback` (el default previo de cada tipo). */
function resolveLegendPosition(config: LuminaChartConfig, fallback: 'top' | 'bottom' | 'left' | 'right'): 'top' | 'bottom' | 'left' | 'right' {
  return config.posicionLeyenda ? LEGEND_POSITION_MAP[config.posicionLeyenda] : fallback;
}

/** Tooltip compartido: respeta `formatoValor` (I4) cuando está definido. */
function buildTooltip(config: LuminaChartConfig): ApexOptions['tooltip'] {
  if (config.isThumbnail) {
    return { enabled: false };
  }
  if (!config.formatoValor) {
    return { enabled: true };
  }
  return {
    enabled: true,
    y: { formatter: (value: number) => formatChartValue(value, config.formatoValor) },
  };
}

function buildXAxis(config: LuminaChartConfig, theme: LuminaChartTheme, isNumeric = false): ApexOptions['xaxis'] {
  const hidden = Boolean(config.ejeXOculto);
  return {
    ...(isNumeric ? { type: 'numeric' } : { categories: config.categorias }),
    ...(config.ejeXTitulo && !hidden
      ? {
          title: {
            text: config.ejeXTitulo,
            style: { fontSize: config.isThumbnail ? '8px' : '11px', color: theme.mutedColor },
          },
        }
      : {}),
    axisBorder: { show: !hidden },
    axisTicks: { show: !hidden },
    labels: {
      show: !hidden,
      ...(config.ejeXRotacion !== undefined ? { rotate: config.ejeXRotacion } : {}),
      ...(isNumeric && config.formatoValor
        ? { formatter: (value: string) => formatChartValue(Number(value), config.formatoValor) }
        : {}),
      style: { fontSize: config.isThumbnail ? '8px' : '11px', colors: theme.mutedColor },
    },
  };
}

function buildYAxis(config: LuminaChartConfig, theme: LuminaChartTheme): ApexOptions['yaxis'] {
  const hasSecondary = config.type === 'combo' && config.series.some((s) => s.ejeCombo === 'secundario');
  const hidden = Boolean(config.ejeYOculto);

  const primaryY: Record<string, unknown> = {
    show: !hidden,
    labels: {
      show: !hidden,
      style: { fontSize: config.isThumbnail ? '8px' : '11px', colors: theme.mutedColor },
      ...(config.formatoValor
        ? { formatter: (value: number) => formatChartValue(value, config.formatoValor) }
        : {}),
    },
  };

  if (config.ejeYTitulo && !hidden) {
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
  // `boxPlot` guarda su dato en `cajas` (no en `valores`) y `histogram` no usa
  // `categorias`/`valores` como grilla categoría↔serie — el reordenamiento
  // por "primera serie" no tiene sentido para ninguno de los dos (Etapa I3).
  if (config.type === 'boxPlot' || config.type === 'histogram') {
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

  const colors = config.series.map((s, idx) => resolveColor(idx, config, s.color));

  const series: ApexCartesianSeries = isCombo
    ? config.series.map((s) => ({
        name: s.nombre,
        type: s.tipoCombo ?? 'column',
        data: s.valores,
      }))
    : config.series.map((s) => ({ name: s.nombre, data: s.valores }));

  const curveFor = (curva: LuminaChartConfig['curva']) =>
    curva === 'recta' ? ('straight' as const) : curva === 'escalon' ? ('stepline' as const) : ('smooth' as const);
  const apexCurve = curveFor(config.curva);
  // Curva/grosor por serie (I4): solo se vuelven arreglos cuando al menos una
  // serie los pide explícitamente — si no, el valor sigue siendo el escalar
  // global de siempre (paridad exacta con el comportamiento previo a I4).
  const perSeriesCurva = config.series.some((s) => s.curvaLinea !== undefined);
  const perSeriesGrosor = config.series.some((s) => s.grosorLinea !== undefined);
  const anyMarkers = config.series.some((s) => s.mostrarPuntos);
  const perSeriesOpacidad = config.series.some((s) => s.opacidadRelleno !== undefined);

  const stroke = isCombo
    ? {
        width: config.series.map((s) => (s.tipoCombo === 'line' ? (s.grosorLinea ?? 2) : 0)),
        curve: perSeriesCurva ? config.series.map((s) => curveFor(s.curvaLinea ?? config.curva)) : apexCurve,
      }
    : config.type === 'line' || config.type === 'area'
      ? {
          curve: perSeriesCurva ? config.series.map((s) => curveFor(s.curvaLinea ?? config.curva)) : apexCurve,
          width: perSeriesGrosor ? config.series.map((s) => s.grosorLinea ?? 2) : 2,
        }
      : { width: 0 };

  const fill =
    config.type === 'area'
      ? perSeriesOpacidad
        ? { opacity: config.series.map((s) => s.opacidadRelleno ?? 0.2) }
        : { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.05 } }
      : perSeriesOpacidad
        ? { opacity: config.series.map((s) => s.opacidadRelleno ?? 1) }
        : { opacity: 1 };

  const options: ApexOptions = {
    chart: { ...baseChartOptions(config, theme), type: apexChartType },
    colors,
    xaxis: buildXAxis(config, theme),
    yaxis: buildYAxis(config, theme),
    grid: buildGrid(config, theme),
    legend: {
      show: Boolean(config.mostrarLeyenda) && !config.isThumbnail && !config.modoSparkline,
      position: resolveLegendPosition(config, 'bottom'),
      fontSize: '11px',
      labels: { colors: theme.foreColor },
    },
    tooltip: buildTooltip(config),
    dataLabels: buildDataLabels(config, false),
    stroke,
    fill,
    ...(anyMarkers ? { markers: { size: config.series.map((s) => (s.mostrarPuntos ? 4 : 0)) } } : {}),
    ...(buildAnnotations(config, theme) ? { annotations: buildAnnotations(config, theme) } : {}),
    plotOptions: {
      bar: {
        horizontal: isHorizontalBar,
        borderRadius: config.estilo?.esquinas ?? 4,
        columnWidth: '60%',
      },
    },
  };

  return { chartType: apexChartType, series, options };
}

function buildScatterOrBubbleChart(config: LuminaChartConfig, theme: LuminaChartTheme): BuiltApexChart {
  const chartType = config.type as 'scatter' | 'bubble';
  const colors = config.series.map((s, idx) => resolveColor(idx, config, s.color));

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
    grid: buildGrid(config, theme),
    legend: {
      show: Boolean(config.mostrarLeyenda) && !config.isThumbnail,
      position: resolveLegendPosition(config, 'bottom'),
      fontSize: '11px',
      labels: { colors: theme.foreColor },
    },
    tooltip: buildTooltip(config),
    dataLabels: buildDataLabels(config, false),
    ...(buildAnnotations(config, theme) ? { annotations: buildAnnotations(config, theme) } : {}),
  };

  return { chartType, series, options };
}

function buildRadarChart(config: LuminaChartConfig, theme: LuminaChartTheme): BuiltApexChart {
  const colors = config.series.map((s, idx) => resolveColor(idx, config, s.color));
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
      position: resolveLegendPosition(config, 'bottom'),
      fontSize: '11px',
      labels: { colors: theme.foreColor },
    },
    tooltip: buildTooltip(config),
    dataLabels: buildDataLabels(config, false),
    stroke: { width: 2 },
    markers: { size: 3 },
  };

  return { chartType: 'radar', series, options };
}

function buildTreemapChart(config: LuminaChartConfig, theme: LuminaChartTheme): BuiltApexChart {
  const primary = config.series[0];
  const colors = config.categorias.map((_, idx) => resolveColor(idx, config));
  const data = config.categorias.map((cat, idx) => ({
    x: cat,
    y: primary?.valores[idx] ?? 0,
  }));

  const series: ApexCartesianSeries = [{ data }];

  const options: ApexOptions = {
    chart: { ...baseChartOptions(config, theme), type: 'treemap' },
    colors,
    legend: { show: false },
    tooltip: buildTooltip(config),
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
  const colors = config.categorias.map((_, idx) => resolveColor(idx, config));
  const data = config.categorias.map((_, idx) => primary?.valores[idx] ?? 0);

  const series: ApexCartesianSeries = [{ name: primary?.nombre || 'Etapas', data }];

  const options: ApexOptions = {
    chart: { ...baseChartOptions(config, theme), type: 'bar' },
    colors,
    xaxis: buildXAxis(config, theme),
    yaxis: buildYAxis(config, theme),
    grid: buildGrid(config, theme),
    legend: { show: false },
    tooltip: buildTooltip(config),
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
  const colors = [resolveColor(0, config)];
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
    grid: buildGrid(config, theme),
    legend: {
      show: Boolean(config.mostrarLeyenda) && !config.isThumbnail,
      position: resolveLegendPosition(config, 'bottom'),
      fontSize: '11px',
      labels: { colors: theme.foreColor },
    },
    tooltip: buildTooltip(config),
    dataLabels: buildDataLabels(config, false),
    plotOptions: {
      heatmap: {
        radius: config.estilo?.esquinas ?? 2,
        enableShades: true,
      },
    },
  };

  return { chartType: 'heatmap', series, options };
}

function buildCircularChart(config: LuminaChartConfig, theme: LuminaChartTheme): BuiltApexChart {
  const primary = config.series[0];
  const values = config.categorias.map((_, idx) => primary?.valores[idx] ?? 0);
  const colors = config.categorias.map((_, idx) => resolveColor(idx, config));

  const isSemicircle = config.angulo === 'semicirculo';
  const isRadial = config.type === 'radialBar';
  const isDonut = config.type === 'donut';

  // `plotOptions` NUNCA debe quedar `undefined` de forma explícita: el merge
  // de config por defecto de ApexCharts asume que `plotOptions` es al menos
  // `{}` y luego intenta leer `plotOptions.line.*` internamente — con la
  // clave presente mismo valor `undefined` (a diferencia de omitirla del
  // todo) ese merge deja `plotOptions` en `undefined` y revienta con
  // "Cannot read properties of undefined (reading 'line')" en cuanto se monta
  // un `pie` liso (bug real encontrado en producción, no artefacto de dev).
  let plotOptions: ApexOptions['plotOptions'] = {};

  if (isRadial) {
    const grosorAnillo = config.estilo?.grosorAnillo;
    const hollowSize = grosorAnillo !== undefined ? Math.min(Math.max(grosorAnillo, 0), 100) : 30;
    plotOptions = {
      radialBar: {
        hollow: { size: `${hollowSize}%` },
        ...(isSemicircle
          ? {
              startAngle: -90,
              endAngle: 90,
              offsetY: -10,
            }
          : {}),
      },
    };
  } else {
    const pieOrDonutOptions: NonNullable<NonNullable<ApexOptions['plotOptions']>['pie']> = {
      ...(isDonut ? { donut: { size: '65%' } } : {}),
      ...(isSemicircle
        ? {
            startAngle: -90,
            endAngle: 90,
            offsetY: 10,
          }
        : {}),
    };

    if (isDonut && config.mostrarTotal) {
      const totalSum = values.reduce((acc, v) => acc + v, 0);
      pieOrDonutOptions.donut = {
        size: '65%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Total',
            color: theme.foreColor,
            formatter: () => String(totalSum),
          },
        },
      };
    }

    plotOptions = Object.keys(pieOrDonutOptions).length > 0 ? { pie: pieOrDonutOptions } : {};
  }

  // Leyenda a la derecha (default histórico de radialBar) + `chart.height:
  // 'auto'` (necesario para posicionar bien el semicírculo, ver
  // `isPartialArcChart`) hacen que ApexCharts iguale gridHeight a gridWidth
  // (`Dimensions.js`, rama legend.position==='right'/'left') — el radio del
  // arco termina limitado por (ancho de la tarjeta − ancho de la leyenda) en
  // vez de por el alto real disponible, y como el semicírculo no crece para
  // aprovechar el alto que le sobra, se ve chico. Con leyenda arriba/abajo
  // esa rama nunca se activa. Solo cambia el *fallback*: un `posicionLeyenda`
  // explícito del docente sigue ganando (`resolveLegendPosition`).
  const legendFallback = isRadial && isSemicircle ? 'bottom' : config.type === 'radialBar' ? 'right' : 'bottom';

  const options: ApexOptions = {
    chart: { ...baseChartOptions(config, theme), type: config.type as 'pie' | 'donut' | 'radialBar' },
    colors,
    labels: config.categorias,
    legend: {
      show: Boolean(config.mostrarLeyenda) && !config.isThumbnail && !config.modoSparkline,
      position: resolveLegendPosition(config, legendFallback),
      fontSize: '11px',
      labels: { colors: theme.foreColor },
    },
    tooltip: buildTooltip(config),
    dataLabels: buildDataLabels(config, config.type !== 'radialBar'),
    plotOptions,
    ...(isRadial && config.estilo?.puntasRedondeadas
      ? { stroke: { lineCap: 'round' as const } }
      : {}),
  };

  return { chartType: config.type as 'pie' | 'donut' | 'radialBar', series: values, options };
}

function buildPolarAreaChart(config: LuminaChartConfig, theme: LuminaChartTheme): BuiltApexChart {
  const primary = config.series[0];
  const values = config.categorias.map((_, idx) => primary?.valores[idx] ?? 0);
  const colors = config.categorias.map((_, idx) => resolveColor(idx, config));

  const options: ApexOptions = {
    chart: { ...baseChartOptions(config, theme), type: 'polarArea' },
    colors,
    labels: config.categorias,
    stroke: { colors: [theme.borderColor], width: 1 },
    fill: { opacity: 0.85 },
    yaxis: { show: false },
    legend: {
      show: Boolean(config.mostrarLeyenda) && !config.isThumbnail && !config.modoSparkline,
      position: resolveLegendPosition(config, 'bottom'),
      fontSize: '11px',
      labels: { colors: theme.foreColor },
    },
    tooltip: buildTooltip(config),
    dataLabels: buildDataLabels(config, false),
    plotOptions: {
      polarArea: {
        rings: { strokeWidth: 1, strokeColor: theme.borderColor },
        spokes: { strokeWidth: 1, connectorColors: theme.borderColor },
      },
    },
  };

  return { chartType: 'polarArea', series: values, options };
}

function buildWaterfallChart(config: LuminaChartConfig, theme: LuminaChartTheme): BuiltApexChart {
  const primary = config.series[0];
  const rawValues = config.categorias.map((_, idx) => primary?.valores[idx] ?? 0);

  const baseColor = resolveColor(0, config, primary?.color);
  const positiveColor = '#10b981';
  const negativeColor = '#ef4444';

  let runningTotal = 0;
  const data = config.categorias.map((cat, idx) => {
    const val = rawValues[idx];
    let bottom = 0;
    let top = 0;
    let barColor = baseColor;

    if (idx === 0) {
      if (val >= 0) {
        bottom = 0;
        top = val;
      } else {
        bottom = val;
        top = 0;
      }
      runningTotal = val;
      barColor = baseColor;
    } else {
      if (val >= 0) {
        bottom = runningTotal;
        top = runningTotal + val;
        barColor = positiveColor;
      } else {
        bottom = runningTotal + val;
        top = runningTotal;
        barColor = negativeColor;
      }
      runningTotal += val;
    }

    return {
      x: cat,
      y: [bottom, top],
      fillColor: barColor,
    };
  });

  const series: ApexCartesianSeries = [
    {
      name: primary?.nombre || 'Variación',
      data,
    },
  ];

  const options: ApexOptions = {
    chart: { ...baseChartOptions(config, theme), type: 'bar' },
    xaxis: buildXAxis(config, theme),
    yaxis: buildYAxis(config, theme),
    grid: buildGrid(config, theme),
    legend: { show: false },
    tooltip: buildTooltip(config),
    dataLabels: buildDataLabels(config, true),
    ...(buildAnnotations(config, theme) ? { annotations: buildAnnotations(config, theme) } : {}),
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: config.estilo?.esquinas ?? 2,
        columnWidth: '55%',
      },
    },
  };

  return { chartType: 'bar', series, options };
}

function buildBoxPlotChart(config: LuminaChartConfig, theme: LuminaChartTheme): BuiltApexChart {
  const colors = config.series.map((s, idx) => resolveColor(idx, config, s.color));

  const series: ApexCartesianSeries = config.series.map((s) => ({
    name: s.nombre,
    data: config.categorias.map((cat, idx) => {
      const caja = s.cajas?.[idx];
      return {
        x: cat,
        y: caja ? [caja.min, caja.q1, caja.mediana, caja.q3, caja.max] : [0, 0, 0, 0, 0],
      };
    }),
  }));

  const options: ApexOptions = {
    chart: { ...baseChartOptions(config, theme), type: 'boxPlot' },
    colors,
    xaxis: buildXAxis(config, theme),
    yaxis: buildYAxis(config, theme),
    grid: buildGrid(config, theme),
    legend: {
      show: Boolean(config.mostrarLeyenda) && !config.isThumbnail,
      position: resolveLegendPosition(config, 'bottom'),
      fontSize: '11px',
      labels: { colors: theme.foreColor },
    },
    tooltip: buildTooltip(config),
    plotOptions: {
      boxPlot: {
        colors: {
          upper: colors[0] ?? theme.foreColor,
          lower: colors[1] ?? colors[0] ?? theme.mutedColor,
        },
      },
    },
  };

  return { chartType: 'boxPlot', series, options };
}

function buildHistogramChart(config: LuminaChartConfig, theme: LuminaChartTheme): BuiltApexChart {
  const primary = config.series[0];
  const binCount = sanitizeHistogramBinCount(config.histogramBins);
  const { labels, counts } = computeHistogramBins(primary?.valores ?? [], binCount);
  const colors = [resolveColor(0, config, primary?.color)];

  const series: ApexCartesianSeries = [{ name: primary?.nombre || 'Frecuencia', data: counts }];

  const options: ApexOptions = {
    chart: { ...baseChartOptions(config, theme), type: 'bar' },
    colors,
    // Las etiquetas del eje X son los bordes de cada intervalo (bin), no las
    // `categorias` del bloque — `histogram` las ignora (Etapa I3).
    xaxis: buildXAxis({ ...config, categorias: labels }, theme),
    yaxis: buildYAxis(config, theme),
    grid: buildGrid(config, theme),
    legend: { show: false },
    tooltip: buildTooltip(config),
    dataLabels: buildDataLabels(config, false),
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: config.estilo?.esquinas ?? 4,
        columnWidth: '90%',
      },
    },
  };

  return { chartType: 'bar', series, options };
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
    case 'waterfall':
      return buildWaterfallChart(config, theme);
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
    case 'polarArea':
      return buildPolarAreaChart(config, theme);
    case 'boxPlot':
      return buildBoxPlotChart(config, theme);
    case 'histogram':
      return buildHistogramChart(config, theme);
    case 'pie':
    case 'donut':
    case 'radialBar':
      return buildCircularChart(config, theme);
    default:
      return buildCartesianChart({ ...config, type: 'column' }, theme);
  }
}
