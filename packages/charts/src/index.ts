/** API pública de `@lumina/charts` (Etapa H). Único paquete de visualización de datos de Lumina. */

export type {
  LuminaChartType,
  LuminaChartFamily,
  LuminaChartFamilyMeta,
  LuminaChartTypeMeta,
  LuminaChartSeries,
  LuminaChartPoint,
  LuminaChartBoxPlotPoint,
  LuminaChartReferenceLine,
  LuminaChartBand,
  LuminaChartStyle,
  LuminaChartConfig,
} from './types.js';
export {
  LUMINA_CHART_TYPES,
  LUMINA_CHART_FAMILIES,
  LUMINA_CHART_TYPE_META,
  getChartFamily,
  getChartTypesByFamily,
} from './types.js';

export { LuminaChart, isPartialArcChart, type LuminaChartProps } from './chart-container.js';

export {
  LUMINA_CHART_PALETTES,
  LUMINA_SEMANTIC_PALETTE,
  DEFAULT_LUMINA_PALETTE_ID,
  getSeriesColor,
  type LuminaColorPalette,
  type LuminaSemanticRole,
} from './palettes.js';

export {
  formatChartValue,
  formatCurrency,
  formatDecimal,
  formatInteger,
  formatPercent,
  formatScale0a5,
  type LuminaValueFormat,
} from './format.js';

export { resolveChartTheme, type LuminaChartTheme } from './chart-theme.js';

export {
  computeHistogramBins,
  sanitizeHistogramBinCount,
  DEFAULT_HISTOGRAM_BINS,
  MIN_HISTOGRAM_BINS,
  MAX_HISTOGRAM_BINS,
  type HistogramBins,
} from './histogram.js';

export { generarResumenAccesible } from './accessible-summary.js';
