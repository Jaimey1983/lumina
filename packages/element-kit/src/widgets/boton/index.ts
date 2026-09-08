/**
 * API pública del widget Botón para consumidores del workspace
 * (`@lumina/element-kit` en E1.4). Sin cambiar comportamiento.
 */
export type { BotonWidget } from '@lumina/types/widget';
export {
  SlideNavContext,
  useSlideNav,
  type SlideNavAction,
  type SlideNavValue,
} from '@lumina/editor-shared/slide-nav-context';
export {
  BOTON_VARIANTES,
  DEFAULT_BOTON_ACCION,
  DEFAULT_BOTON_FORMA,
  DEFAULT_BOTON_TAMANO,
  DEFAULT_BOTON_TEXTO,
  DEFAULT_BOTON_VARIANTE,
  botonFallbackSize,
  createDefaultBotonBlock,
  mergedBotonConfig,
  normalizeBotonWidget,
  type MergedBotonConfig,
} from './boton-config.js';
export { BotonEditor } from './boton-editor.js';
export { BotonViewer } from './boton-viewer.js';
export { BotonProperties, type BotonPropertiesProps } from './boton-properties.js';
export { BotonParts } from './boton-parts.js';
