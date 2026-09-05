/** API pública del widget Ruleta para `@lumina/element-kit` (E3.1). */
export type { RuletaWidget } from '@/types/widget.types';
export {
  DEFAULT_RULETA_DURACION,
  createDefaultRuleta,
  createDefaultRuletaWidget,
  normalizeRuletaBlock,
  ruletaWidgetToActivity,
} from './ruleta-defaults';
export { RuletaEditor } from './ruleta-editor';
export { RuletaViewer } from './ruleta-viewer';
export { RuletaProperties, type RuletaPropertiesProps } from './ruleta-properties';
export { RuletaWheel } from './ruleta-wheel';
