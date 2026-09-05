/** API pública del widget Progreso (Barra) para `@lumina/element-kit` (E3.2). */
export type { ProgresoWidget } from '@/types/widget.types';
export {
  createDefaultProgresoBlock,
  normalizeProgresoWidget,
} from './progreso-defaults';
export { ProgresoEditor } from './progreso-editor';
export { ProgresoViewer } from './progreso-viewer';
export { ProgresoProperties, type ProgresoPropertiesProps } from './progreso-properties';
