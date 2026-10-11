/** API pública del widget Progreso (Barra) para `@lumina/element-kit` (E3.2). */
export type { ProgresoWidget } from '@lumina/types/widget';
export {
  PROGRESO_VARIANTES,
  createDefaultProgresoBlock,
  normalizeProgresoWidget,
  type ProgresoHito,
  type ProgresoT9,
  type ProgresoVariante,
  type ProgresoWidgetT9,
} from './progreso-defaults.js';
export { ProgresoEditor } from './progreso-editor.js';
export { ProgresoViewer } from './progreso-viewer.js';
export { ProgresoProperties, type ProgresoPropertiesProps } from './progreso-properties.js';
