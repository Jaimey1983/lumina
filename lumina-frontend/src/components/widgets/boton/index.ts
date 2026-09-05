/**
 * API pública del widget Botón para consumidores del workspace
 * (`@lumina/element-kit` en E1.4). Sin cambiar comportamiento.
 */
export type { BotonWidget } from '@/types/widget.types';
export {
  SlideNavContext,
  useSlideNav,
  type SlideNavAction,
  type SlideNavValue,
} from '@/components/widgets/shared/slide-nav-context';
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
} from './boton-config';
export { BotonEditor } from './boton-editor';
export { BotonViewer } from './boton-viewer';
export { BotonProperties, type BotonPropertiesProps } from './boton-properties';
export { BotonParts } from './boton-parts';
