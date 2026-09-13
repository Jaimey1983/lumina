/** API pública del bloque Gráfico para `@lumina/element-kit` (E4.1). */
export type { GraficoDatosBlock } from '@lumina/types/slide';
export {
  createDefaultGraficoBlock,
  normalizeGraficoBlock,
} from './grafico-defaults.js';
export { GRAFICO_TEMPLATES, type GraficoTemplate } from './grafico-templates.js';
export {
  parseClipboardTable,
  transposeChartData,
  sortChartDataBySeries,
} from './grafico-data-utils.js';
export { GraficoEditor } from './grafico-editor.js';
export { GraficoViewer } from './grafico-viewer.js';
export { GraficoProperties } from './grafico-properties.js';

