/** API pública del widget Contador para `@lumina/element-kit` (E3.2). */
export type { ContadorWidget } from '@/types/widget.types';
export {
  createDefaultContadorBlock,
  normalizeContadorWidget,
} from './contador-defaults';
export { ContadorEditor } from './contador-editor';
export { ContadorViewer } from './contador-viewer';
export { ContadorProperties, type ContadorPropertiesProps } from './contador-properties';
