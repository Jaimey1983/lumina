// ─── Binning puro para el tipo `histogram` (Etapa I, I3) ───────────────────
// `histogram` no es un tipo nativo de ApexCharts: agrupamos valores continuos
// en intervalos (bins) de igual ancho antes de graficar como columnas. La
// lógica vive separada del adapter de ApexCharts (`apex/build-apex-options.ts`)
// para poder probarla sin construir opciones de chart.

export const DEFAULT_HISTOGRAM_BINS = 8;
export const MIN_HISTOGRAM_BINS = 2;
export const MAX_HISTOGRAM_BINS = 20;

export interface HistogramBins {
  /** Etiquetas de cada intervalo (p. ej. "10–20"), en el mismo orden que `counts`. */
  labels: string[];
  /** Frecuencia (cantidad de valores) de cada intervalo. */
  counts: number[];
}

/**
 * Redondea y acota un número de bins pedido al rango válido
 * [`MIN_HISTOGRAM_BINS`, `MAX_HISTOGRAM_BINS`], con `DEFAULT_HISTOGRAM_BINS`
 * como valor por defecto cuando no se especifica un número finito.
 */
export function sanitizeHistogramBinCount(raw: number | undefined): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return DEFAULT_HISTOGRAM_BINS;
  }
  const rounded = Math.round(raw);
  return Math.min(MAX_HISTOGRAM_BINS, Math.max(MIN_HISTOGRAM_BINS, rounded));
}

function formatBinEdge(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

/**
 * Agrupa `values` en `binCount` intervalos de igual ancho y cuenta cuántos
 * valores caen en cada uno. El último intervalo es cerrado (incluye el
 * máximo). Valores no finitos (`NaN`/`Infinity`) se descartan.
 */
export function computeHistogramBins(values: number[], binCount: number | undefined): HistogramBins {
  const clean = values.filter((v) => Number.isFinite(v));
  const bins = sanitizeHistogramBinCount(binCount);

  if (clean.length === 0) {
    return {
      labels: Array.from({ length: bins }, (_, i) => `Intervalo ${i + 1}`),
      counts: Array.from({ length: bins }, () => 0),
    };
  }

  const min = Math.min(...clean);
  const max = Math.max(...clean);

  if (min === max) {
    return { labels: [formatBinEdge(min)], counts: [clean.length] };
  }

  const width = (max - min) / bins;
  const counts = Array.from({ length: bins }, () => 0);

  for (const value of clean) {
    let idx = Math.floor((value - min) / width);
    if (idx >= bins) idx = bins - 1;
    if (idx < 0) idx = 0;
    counts[idx]++;
  }

  const labels = Array.from({ length: bins }, (_, i) => {
    const from = min + i * width;
    const to = min + (i + 1) * width;
    return `${formatBinEdge(from)}–${formatBinEdge(to)}`;
  });

  return { labels, counts };
}
