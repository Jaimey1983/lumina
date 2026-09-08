/** API pública del widget Ruleta para `@lumina/element-kit` (E3.1). */
export type { RuletaWidget } from '@lumina/types/widget';
export {
  DEFAULT_RULETA_DURACION,
  createDefaultRuleta,
  createDefaultRuletaWidget,
  normalizeRuletaBlock,
  ruletaWidgetToActivity,
} from './ruleta-defaults.js';
export { RuletaEditor } from './ruleta-editor.js';
export { RuletaViewer } from './ruleta-viewer.js';
export { RuletaProperties, type RuletaPropertiesProps } from './ruleta-properties.js';
export { RuletaWheel } from './ruleta-wheel.js';
