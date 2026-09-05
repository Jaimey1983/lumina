/** API pública del widget Popup para `@lumina/element-kit` (E3.4). */
export type { PopupWidget } from '@/types/widget.types';
export {
  DEFAULT_POPUP_CONFIG,
  createDefaultPopupBlock,
  createDefaultPopupOverlay,
  normalizePopupWidget,
} from '@/lib/popup-defaults';
export { PopupEditor } from './popup-editor';
export { PopupViewer } from './popup-viewer';
export { PopupWidgetComponentes as PopupProperties } from './popup-properties';
