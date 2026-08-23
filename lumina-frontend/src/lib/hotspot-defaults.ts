import type { BlockMarco } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import type { HotspotConfiguracion, HotspotWidget, WidgetSlideContent } from '@/types/widget.types';
import { coerceWidgetLayoutId } from '@/components/widgets/shared/widget-layouts';

export const DEFAULT_HOTSPOT_CONFIG: HotspotConfiguracion = {
  colorPulso: '#EF4444',
  tamanoPunto: 'pequeno',
  triggerEvento: 'click',
  posicionBurbuja: 'auto',
  efectoApertura: 'fade',
  colorFondoBurbuja: '#FFFFFF',
  mostrarBotonCerrar: true,
  anchoBurbuja: 280,
};

export function createDefaultHotspotOverlay(): WidgetSlideContent {
  return {
    id: crypto.randomUUID(),
    etiqueta: '01',
    encabezado: 'Título del hotspot',
    subtitulo: '',
    cuerpo:
      'Descripción detallada del punto de interés marcado por este hotspot. Puedes editar este texto.',
    layoutId: 'solo-texto',
    mostrarImagen: false,
    mostrarEncabezado: true,
    mostrarCuerpo: true,
    mostrarSubtitulo: false,
  };
}

export function normalizeHotspotWidget(block: HotspotWidget): HotspotWidget {
  const rawConfig = block.configuracion ?? ({} as Partial<HotspotConfiguracion>);
  const overlayRaw = block.overlay;

  let overlay: WidgetSlideContent;
  if (overlayRaw && typeof overlayRaw === 'object' && overlayRaw.id) {
    overlay = {
      ...createDefaultHotspotOverlay(),
      ...overlayRaw,
      id: overlayRaw.id,
      layoutId: coerceWidgetLayoutId(overlayRaw.layoutId ?? 'solo-texto'),
    };
  } else {
    overlay = createDefaultHotspotOverlay();
  }

  return {
    tituloWidget: block.tituloWidget ?? '',
    subtituloWidget: block.subtituloWidget ?? '',
    instruccion: block.instruccion ?? '',
    estilosHeader: block.estilosHeader,
    tipo: 'hotspot',
    x: block.x,
    y: block.y,
    ancho: block.ancho,
    alto: block.alto,
    zIndex: block.zIndex,
    overlay,
    configuracion: {
      ...DEFAULT_HOTSPOT_CONFIG,
      ...rawConfig,
    },
  };
}

export const DEFAULT_HOTSPOT_CONTENT: Omit<
  HotspotWidget,
  'tipo' | 'x' | 'y' | 'ancho' | 'alto' | 'zIndex'
> = {
  tituloWidget: '',
  subtituloWidget: '',
  instruccion: '',
  configuracion: { ...DEFAULT_HOTSPOT_CONFIG },
  overlay: createDefaultHotspotOverlay(),
};

export function createDefaultHotspotBlock(marco?: BlockMarco): HotspotWidget {
  const fb = BLOCK_FALLBACKS.hotspot;
  const base = {
    tipo: 'hotspot' as const,
    ...DEFAULT_HOTSPOT_CONTENT,
    overlay: createDefaultHotspotOverlay(),
  };
  if (marco) {
    return normalizeHotspotWidget({
      ...base,
      x: marco.izquierdaPct,
      y: marco.arribaPct,
      ancho: fb.ancho,
      alto: fb.alto,
    });
  }
  return normalizeHotspotWidget({
    ...base,
    x: fb.x,
    y: fb.y,
    ancho: fb.ancho,
    alto: fb.alto,
  });
}
