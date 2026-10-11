/** API pública del widget Contador para `@lumina/element-kit` (E3.2). */
export type { ContadorWidget } from '@lumina/types/widget';
export {
  type ContadorHito,
  type ContadorHitosAlerta,
  type ContadorT10,
  type ContadorVariante,
  type ContadorWidgetT10,
  createDefaultContadorBlock,
  normalizeContadorWidget,
} from './contador-defaults.js';
export { ContadorEditor } from './contador-editor.js';
export { ContadorViewer } from './contador-viewer.js';
export { ContadorProperties, type ContadorPropertiesProps } from './contador-properties.js';
