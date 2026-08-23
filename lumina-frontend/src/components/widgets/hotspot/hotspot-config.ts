import type { CSSProperties } from 'react';
import type {
  HotspotConfiguracion,
  HotspotInnerSelection,
  HotspotWidget,
  WidgetSlideContent,
  WidgetSlidePanelConfig,
} from '@/types/widget.types';
import { coerceWidgetLayoutId, resolveSlideLayoutId } from '@/components/widgets/shared/widget-layouts';
import {
  DEFAULT_HOTSPOT_CONFIG,
  normalizeHotspotWidget,
} from '@/lib/hotspot-defaults';

export {
  DEFAULT_HOTSPOT_CONFIG,
  createDefaultHotspotBlock,
  createDefaultHotspotOverlay,
  normalizeHotspotWidget,
} from '@/lib/hotspot-defaults';

export function mergedHotspotConfig(block: HotspotWidget): HotspotConfiguracion {
  const w = normalizeHotspotWidget(block);
  const raw = w.configuracion;
  return {
    ...DEFAULT_HOTSPOT_CONFIG,
    ...raw,
  };
}

export function toHotspotSlidePanelConfig(
  configuracion: HotspotConfiguracion,
  overlay: WidgetSlideContent,
): WidgetSlidePanelConfig {
  return {
    layoutId: resolveSlideLayoutId(overlay, overlay.layoutId ?? 'solo-texto'),
    colorBordeContenido: 'transparent',
    defaultsSlide: {
      mostrarImagen: false,
      mostrarTitulo: true,
      mostrarCuerpo: true,
      mostrarEncabezado: true,
      mostrarSubtitulo: false,
      mostrarTarjeta: false,
    },
  };
}

export function isEditingHotspotOverlay(
  inner: HotspotInnerSelection | null | undefined,
): boolean {
  return (
    inner?.kind === 'overlay' ||
    inner?.kind === 'overlay-text' ||
    inner?.kind === 'overlay-image'
  );
}

export function hotspotChromeStyle(block: HotspotWidget): CSSProperties {
  const cfg = mergedHotspotConfig(block);
  return {
    ['--hotspot-pulse-color' as string]: cfg.colorPulso,
    ['--hotspot-bubble-bg' as string]: cfg.colorFondoBurbuja,
    ['--hotspot-bubble-width' as string]: `${cfg.anchoBurbuja}px`,
  };
}
