import type { BlockMarco } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import type { PopupConfiguracion, PopupWidget, WidgetSlideContent } from '@/types/widget.types';
import { DEFAULT_POPUP_OVERLAY_VISIBILIDAD } from '@/types/widget.types';
import { coerceWidgetLayoutId } from '@/components/widgets/shared/widget-layouts';
import {
  DEFAULT_POPUP_TRIGGER_PX,
  popupTriggerPctFromPx,
  popupTriggerPxFromPct,
  clampPopupTriggerPx,
} from '@/lib/popup-trigger-size';

export const DEFAULT_POPUP_CONFIG: PopupConfiguracion = {
  triggerVisual: 'boton',
  triggerTexto: 'Ver más',
  triggerIcono: 'info',
  triggerTamano: 'mediano',
  triggerAnchoPx: DEFAULT_POPUP_TRIGGER_PX,
  triggerAltoPx: DEFAULT_POPUP_TRIGGER_PX,
  triggerSubrayado: true,
  triggerImagenAncho: 48,
  triggerImagenAlto: 48,
  triggerColorFondo: '#2563EB',
  triggerColorTexto: '#FFFFFF',
  triggerForma: 'pill',
  triggerEvento: 'click',
  efectoApertura: 'fade',
  colorBackdrop: '#1E293B',
  opacidadBackdrop: 45,
  colorFondoModal: '#FFFFFF',
  modalAnchoPct: 55,
  modalAltoPct: 62,
  mostrarBotonCerrar: true,
  layoutId: 'imagen-izq-texto-der',
  colorBordeContenido: '#93C5FD',
  defaultsOverlay: { ...DEFAULT_POPUP_OVERLAY_VISIBILIDAD },
};

export function createDefaultPopupOverlay(): WidgetSlideContent {
  return {
    id: crypto.randomUUID(),
    etiqueta: '01',
    encabezado: 'Título del popup',
    subtitulo: '',
    cuerpo:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    layoutId: 'imagen-izq-texto-der',
  };
}

export function normalizePopupWidget(block: PopupWidget): PopupWidget {
  const rawConfig = block.configuracion ?? ({} as Partial<PopupConfiguracion>);
  const overlayRaw = block.overlay;

  let overlay: WidgetSlideContent;
  if (overlayRaw && typeof overlayRaw === 'object' && overlayRaw.id) {
    overlay = {
      ...createDefaultPopupOverlay(),
      ...overlayRaw,
      id: overlayRaw.id,
    };
  } else {
    overlay = createDefaultPopupOverlay();
  }

  const derivedPx = popupTriggerPxFromBlockPct(block.ancho, block.alto);
  const triggerVisual = rawConfig.triggerVisual ?? DEFAULT_POPUP_CONFIG.triggerVisual;
  const resetOversizedIcon =
    rawConfig.triggerAnchoPx == null &&
    triggerVisual === 'icono' &&
    derivedPx.width > 64;

  return syncPopupBlockSizeFromTriggerPx({
    tituloWidget: block.tituloWidget ?? '',
    subtituloWidget: block.subtituloWidget ?? '',
    instruccion: block.instruccion ?? '',
    estilosHeader: block.estilosHeader,
    tipo: 'popup',
    x: block.x,
    y: block.y,
    ancho: block.ancho,
    alto: block.alto,
    zIndex: block.zIndex,
    overlay,
    configuracion: {
      ...DEFAULT_POPUP_CONFIG,
      ...rawConfig,
      triggerAnchoPx: clampPopupTriggerPx(
        rawConfig.triggerAnchoPx ??
          (resetOversizedIcon ? DEFAULT_POPUP_TRIGGER_PX : derivedPx.width),
      ),
      triggerAltoPx: clampPopupTriggerPx(
        rawConfig.triggerAltoPx ??
          (resetOversizedIcon ? DEFAULT_POPUP_TRIGGER_PX : derivedPx.height),
      ),
      layoutId: coerceWidgetLayoutId(rawConfig.layoutId ?? DEFAULT_POPUP_CONFIG.layoutId),
      defaultsOverlay: {
        ...DEFAULT_POPUP_CONFIG.defaultsOverlay,
        ...rawConfig.defaultsOverlay,
      },
    },
  });
}

function popupTriggerPxFromBlockPct(ancho?: number, alto?: number): { width: number; height: number } {
  if (typeof ancho === 'number' && typeof alto === 'number') {
    return popupTriggerPxFromPct(ancho, alto);
  }
  return { width: DEFAULT_POPUP_TRIGGER_PX, height: DEFAULT_POPUP_TRIGGER_PX };
}

/** Sincroniza ancho/alto % del bloque a partir del tamaño en px del trigger. */
export function syncPopupBlockSizeFromTriggerPx(block: PopupWidget): PopupWidget {
  const pxW = block.configuracion.triggerAnchoPx ?? DEFAULT_POPUP_TRIGGER_PX;
  const pxH = block.configuracion.triggerAltoPx ?? DEFAULT_POPUP_TRIGGER_PX;
  const pct = popupTriggerPctFromPx(pxW, pxH);
  return {
    ...block,
    ancho: pct.ancho,
    alto: pct.alto,
  };
}

export const DEFAULT_POPUP_CONTENT: Omit<
  PopupWidget,
  'tipo' | 'x' | 'y' | 'ancho' | 'alto' | 'zIndex'
> = {
  tituloWidget: '',
  subtituloWidget: '',
  instruccion: '',
  configuracion: { ...DEFAULT_POPUP_CONFIG },
  overlay: createDefaultPopupOverlay(),
};

export function createDefaultPopupBlock(marco?: BlockMarco): PopupWidget {
  const fb = BLOCK_FALLBACKS.popup;
  const base = {
    tipo: 'popup' as const,
    ...DEFAULT_POPUP_CONTENT,
    overlay: createDefaultPopupOverlay(),
  };
  if (marco) {
    return normalizePopupWidget({
      ...base,
      x: marco.izquierdaPct,
      y: marco.arribaPct,
      ancho: marco.anchoPct,
      alto: marco.altoPct,
    });
  }
  const pct = popupTriggerPctFromPx(DEFAULT_POPUP_TRIGGER_PX, DEFAULT_POPUP_TRIGGER_PX);
  return normalizePopupWidget({
    ...base,
    x: fb.x,
    y: fb.y,
    ancho: pct.ancho,
    alto: pct.alto,
  });
}
