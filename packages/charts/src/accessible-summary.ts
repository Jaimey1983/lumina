// ─── Resumen accesible generado automáticamente (Etapa I7) ─────────────────
// Genera una descripción legible en español a partir de los datos reales del
// gráfico, para SUGERIR (no reemplazar) el campo `descripcionAccesible` que
// el docente edita a mano. Función pura, sin dependencia de ApexCharts.

import type { LuminaChartConfig } from './types.js';
import { sanitizeHistogramBinCount } from './histogram.js';
import { formatDecimal } from './format.js';

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : formatDecimal(n, 1);
}

function describeCartesian(config: LuminaChartConfig, tipoLabel: string): string {
  const { categorias, series } = config;
  if (series.length === 0 || categorias.length === 0) {
    return `${tipoLabel} sin datos disponibles.`;
  }

  const partes = series.map((s) => {
    const valores = s.valores.filter((v) => Number.isFinite(v));
    if (valores.length === 0) return `${s.nombre} sin datos`;
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    return min === max ? `${s.nombre} en ${fmt(min)}` : `${s.nombre} varía entre ${fmt(min)} y ${fmt(max)}`;
  });

  // Categoría del valor máximo global, entre todas las series.
  let mejorValor = -Infinity;
  let mejorCategoria: string | undefined;
  series.forEach((s) => {
    s.valores.forEach((v, idx) => {
      if (Number.isFinite(v) && v > mejorValor) {
        mejorValor = v;
        mejorCategoria = categorias[idx];
      }
    });
  });

  const sufijo = mejorCategoria !== undefined ? `, con el valor máximo en ${mejorCategoria}` : '';
  return `${tipoLabel}: ${partes.join(', ')}${sufijo}.`;
}

function describeCircular(config: LuminaChartConfig, tipoLabel: string): string {
  const { categorias, series } = config;
  const primary = series[0];
  if (!primary || categorias.length === 0) {
    return `${tipoLabel} sin datos disponibles.`;
  }

  const valores = categorias.map((_, idx) => primary.valores[idx] ?? 0);
  let maxIdx = 0;
  valores.forEach((v, idx) => {
    if (v > valores[maxIdx]) maxIdx = idx;
  });
  const total = valores.reduce((acc, v) => acc + v, 0);
  const pct = total > 0 ? Math.round((valores[maxIdx] / total) * 100) : undefined;

  return `${tipoLabel} con ${categorias.length} ${categorias.length === 1 ? 'categoría' : 'categorías'}: la mayor es ${categorias[maxIdx]} con ${fmt(valores[maxIdx])}${pct !== undefined ? ` (${pct}% del total)` : ''}.`;
}

function describeScatterOrBubble(config: LuminaChartConfig, tipoLabel: string): string {
  const puntosTotales = config.series.reduce((acc, s) => acc + (s.puntos?.length ?? 0), 0);
  if (puntosTotales === 0) {
    return `${tipoLabel} sin datos disponibles.`;
  }

  const xs = config.series.flatMap((s) => (s.puntos ?? []).map((p) => p.x));
  const ys = config.series.flatMap((s) => (s.puntos ?? []).map((p) => p.y));

  return `${tipoLabel} con ${puntosTotales} ${puntosTotales === 1 ? 'punto' : 'puntos'} en ${config.series.length} ${config.series.length === 1 ? 'serie' : 'series'}: eje X entre ${fmt(Math.min(...xs))} y ${fmt(Math.max(...xs))}, eje Y entre ${fmt(Math.min(...ys))} y ${fmt(Math.max(...ys))}.`;
}

function describeBoxPlot(config: LuminaChartConfig): string {
  const { categorias, series } = config;
  if (categorias.length === 0 || series.length === 0) {
    return 'Diagrama de cajas sin datos disponibles.';
  }

  const mins: number[] = [];
  const maxs: number[] = [];
  series.forEach((s) =>
    (s.cajas ?? []).forEach((c) => {
      mins.push(c.min);
      maxs.push(c.max);
    }),
  );

  if (mins.length === 0) {
    return `Diagrama de cajas con ${categorias.length} ${categorias.length === 1 ? 'grupo' : 'grupos'}, sin datos numéricos.`;
  }

  return `Diagrama de cajas con ${categorias.length} ${categorias.length === 1 ? 'grupo' : 'grupos'}: valores entre ${fmt(Math.min(...mins))} y ${fmt(Math.max(...maxs))}.`;
}

function describeHistogram(config: LuminaChartConfig): string {
  const primary = config.series[0];
  const valores = (primary?.valores ?? []).filter((v) => Number.isFinite(v));
  if (valores.length === 0) {
    return 'Histograma sin datos disponibles.';
  }

  const bins = sanitizeHistogramBinCount(config.histogramBins);
  const min = Math.min(...valores);
  const max = Math.max(...valores);

  return `Histograma de ${valores.length} datos agrupados en ${bins} intervalos, entre ${fmt(min)} y ${fmt(max)}.`;
}

function describePartsOfWhole(config: LuminaChartConfig, tipoLabel: string, plural: string): string {
  const { categorias, series } = config;
  const primary = series[0];
  if (!primary || categorias.length === 0) {
    return `${tipoLabel} sin datos disponibles.`;
  }

  const valores = categorias.map((_, idx) => primary.valores[idx] ?? 0);
  let maxIdx = 0;
  valores.forEach((v, idx) => {
    if (v > valores[maxIdx]) maxIdx = idx;
  });

  return `${tipoLabel} con ${categorias.length} ${plural}: la más grande es ${categorias[maxIdx]} con ${fmt(valores[maxIdx])}.`;
}

function describeHeatmap(config: LuminaChartConfig): string {
  const { categorias, series } = config;
  if (categorias.length === 0 || series.length === 0) {
    return 'Mapa de calor sin datos disponibles.';
  }

  const valores = series.flatMap((s) => s.valores.filter((v) => Number.isFinite(v)));
  if (valores.length === 0) {
    return `Mapa de calor con ${series.length} ${series.length === 1 ? 'fila' : 'filas'} y ${categorias.length} ${categorias.length === 1 ? 'columna' : 'columnas'}, sin datos numéricos.`;
  }

  return `Mapa de calor con ${series.length} ${series.length === 1 ? 'fila' : 'filas'} y ${categorias.length} ${categorias.length === 1 ? 'columna' : 'columnas'}: intensidad entre ${fmt(Math.min(...valores))} y ${fmt(Math.max(...valores))}.`;
}

function describeRadar(config: LuminaChartConfig): string {
  const { categorias, series } = config;
  if (categorias.length === 0 || series.length === 0) {
    return 'Gráfico de radar sin datos disponibles.';
  }

  return `Gráfico de radar con ${categorias.length} ${categorias.length === 1 ? 'eje' : 'ejes'} y ${series.length} ${series.length === 1 ? 'perfil' : 'perfiles'} (${series.map((s) => s.nombre).join(', ')}).`;
}

const CARTESIAN_LABELS: Record<string, string> = {
  column: 'Gráfico de columnas',
  bar: 'Gráfico de barras',
  line: 'Gráfico de líneas',
  area: 'Gráfico de área',
  combo: 'Gráfico combinado',
  waterfall: 'Gráfico de cascada',
};

const CIRCULAR_LABELS: Record<string, string> = {
  pie: 'Gráfico circular',
  donut: 'Gráfico de dona',
  radialBar: 'Gráfico radial',
  polarArea: 'Gráfico de área polar',
};

const SCATTER_LABELS: Record<string, string> = {
  scatter: 'Gráfico de dispersión',
  bubble: 'Gráfico de burbujas',
};

/**
 * Genera un resumen legible en español a partir de los datos reales del
 * gráfico (tipo + valores), para sugerir el campo `descripcionAccesible`.
 * No reemplaza la edición manual del docente — solo la propone.
 */
export function generarResumenAccesible(config: LuminaChartConfig): string {
  switch (config.type) {
    case 'column':
    case 'bar':
    case 'line':
    case 'area':
    case 'combo':
    case 'waterfall':
      return describeCartesian(config, CARTESIAN_LABELS[config.type]);
    case 'pie':
    case 'donut':
    case 'radialBar':
    case 'polarArea':
      return describeCircular(config, CIRCULAR_LABELS[config.type]);
    case 'scatter':
    case 'bubble':
      return describeScatterOrBubble(config, SCATTER_LABELS[config.type]);
    case 'boxPlot':
      return describeBoxPlot(config);
    case 'histogram':
      return describeHistogram(config);
    case 'treemap':
      return describePartsOfWhole(config, 'Treemap', 'áreas');
    case 'funnel':
      return describePartsOfWhole(config, 'Embudo', 'etapas');
    case 'heatmap':
      return describeHeatmap(config);
    case 'radar':
      return describeRadar(config);
    default:
      return 'Gráfico de datos.';
  }
}
