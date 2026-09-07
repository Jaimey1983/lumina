export { alineacionToCss } from './widget-alignment';
export {
  DEFAULT_WIDGET_CAROUSEL_CONTAINER,
  DEFAULT_WIDGET_HEADER_CONFIG,
  DEFAULT_WIDGET_SLIDE_CONTAINER_CONFIG,
} from './widget-config-defaults';
export {
  widgetBodyPadding,
  widgetChromeVarsStyle,
  widgetContainerBackgroundStyle,
  widgetHeaderPadding,
} from './widget-container-styles';
export {
  autoResizeWidgetTextarea,
  stopWidgetInnerPointer,
  useWidgetDraftField,
} from './widget-editor-utils';
export {
  WidgetHeaderEditorField,
  chromeStyles,
} from './widget-header-editor';
export {
  WidgetHeaderViewer,
  type WidgetHeaderViewerConfig,
  type WidgetHeaderViewerProps,
} from './widget-header-viewer';
export {
  imageElementStyle,
  imageWrapperStyle,
} from './widget-image-styles';
export {
  WidgetLayoutGallery,
  type WidgetLayoutGalleryProps,
} from './widget-layout-gallery';
export {
  WIDGET_LAYOUTS,
  coerceWidgetLayoutId,
  isOverlayLayout,
  isSplitLayout,
  resolveSlideLayoutId,
  type WidgetLayoutDef,
} from './widget-layouts';
export { WidgetLayoutThumb } from './widget-layout-thumb';
export {
  WidgetSlideImageInnerProperties,
  WidgetSlideTextInnerProperties,
  type WidgetSlideInnerContext,
  type WidgetSlideInnerPropertiesProps,
} from './widget-inner-properties';
export {
  WidgetSlidePanelEditor,
  WidgetSlidePanelView,
  type WidgetSlidePanelEditorProps,
  type WidgetSlidePanelViewProps,
} from './widget-slide-panel';
export {
  clampCardPos,
  clampWidgetPos,
  DEFAULT_CUERPO_POS,
  DEFAULT_ENCABEZADO_POS,
  DEFAULT_SUBTITULO_POS,
  DEFAULT_TITULO_POS,
  resolveItemVisibilidad,
  resolveSlideVisibilidad,
  resolveTextPos,
  slideSelectionId,
  type WidgetTextField,
} from './widget-slide-utils';
export { textStyleToCss } from './widget-text-styles';
// E7.2: `widget-registry.ts` borrado. `WidgetTipo` / `WIDGET_TIPOS` /
// `isWidgetTipo` viven en `@/types/widget.types`; `WidgetBlock` /
// `isCaptivateWidgetBlock` en `@/types/slide.types`. `WIDGET_LABELS` se retiró
// (el nombre visible sale de `ElementDefinition.catalogo.nombre`).
