import type { CSSProperties } from 'react';
import type {
  PopupConfiguracion,
  PopupInnerSelection,
  PopupOverlayVisibilidad,
  PopupWidget,
  WidgetSlideContent,
  WidgetSlidePanelConfig,
} from '@/types/widget.types';
import { DEFAULT_POPUP_OVERLAY_VISIBILIDAD } from '@/types/widget.types';
import { coerceWidgetLayoutId, resolveSlideLayoutId } from '@/components/widgets/shared/widget-layouts';
import {
  DEFAULT_POPUP_CONFIG,
  normalizePopupWidget,
} from '@/lib/popup-defaults';

export {
  DEFAULT_POPUP_CONFIG,
  createDefaultPopupBlock,
  createDefaultPopupOverlay,
  normalizePopupWidget,
} from '@/lib/popup-defaults';

export function mergedPopupConfig(block: PopupWidget): PopupConfiguracion {
  const w = normalizePopupWidget(block);
  const raw = w.configuracion;
  return {
    ...DEFAULT_POPUP_CONFIG,
    ...raw,
    layoutId: coerceWidgetLayoutId(raw.layoutId),
    defaultsOverlay: {
      ...DEFAULT_POPUP_CONFIG.defaultsOverlay,
      ...raw.defaultsOverlay,
    },
  };
}

export function resolvePopupOverlayVisibilidad(
  defaults: PopupOverlayVisibilidad,
  overlay: WidgetSlideContent,
): PopupOverlayVisibilidad {
  return {
    mostrarEtiqueta: overlay.mostrarEtiqueta ?? defaults.mostrarEtiqueta,
    mostrarImagen: overlay.mostrarImagen ?? defaults.mostrarImagen,
    mostrarEncabezado: overlay.mostrarEncabezado ?? defaults.mostrarEncabezado,
    mostrarSubtitulo: overlay.mostrarSubtitulo ?? defaults.mostrarSubtitulo,
    mostrarCuerpo: overlay.mostrarCuerpo ?? defaults.mostrarCuerpo,
  };
}

export function toPopupSlidePanelConfig(
  configuracion: PopupConfiguracion,
  overlay: WidgetSlideContent,
): WidgetSlidePanelConfig {
  return {
    layoutId: resolveSlideLayoutId(overlay, configuracion.layoutId),
    colorBordeContenido: configuracion.colorBordeContenido,
    defaultsSlide: {
      mostrarImagen: true,
      mostrarTitulo: true,
      mostrarCuerpo: true,
      mostrarEncabezado: true,
      mostrarSubtitulo: true,
      mostrarTarjeta: false,
    },
  };
}

export function isEditingPopupOverlay(
  inner: PopupInnerSelection | null | undefined,
): boolean {
  return (
    inner?.kind === 'overlay' ||
    inner?.kind === 'overlay-text' ||
    inner?.kind === 'overlay-image'
  );
}

export function popupChromeStyle(block: PopupWidget): CSSProperties {
  const cfg = mergedPopupConfig(block);
  const modalAnchoPct = cfg.modalAnchoPct ?? 55;
  const modalAltoPct = cfg.modalAltoPct ?? 62;
  return {
    ['--popup-backdrop-color' as string]: cfg.colorBackdrop,
    ['--popup-backdrop-opacity' as string]: String(cfg.opacidadBackdrop),
    ['--popup-modal-width' as string]: `${modalAnchoPct}%`,
    ['--popup-modal-height' as string]: `${modalAltoPct}%`,
  };
}

export { DEFAULT_POPUP_OVERLAY_VISIBILIDAD };
