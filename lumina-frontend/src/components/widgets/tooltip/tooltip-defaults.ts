import type { BlockMarco } from '@/types/slide.types';
import { BLOCK_FALLBACKS } from '@/types/slide.types';
import type { TooltipPosicion, TooltipTriggerTipo, TooltipWidget } from '@/types/widget.types';

export const DEFAULT_TOOLTIP_COLOR_FONDO = '#0F172A';
export const DEFAULT_TOOLTIP_COLOR_TEXTO = '#F8FAFC';
export const DEFAULT_TOOLTIP_POSICION: TooltipPosicion = 'auto';
export const DEFAULT_TOOLTIP_TRIGGER: TooltipTriggerTipo = 'icono';
export const DEFAULT_TOOLTIP_ICONO = 'info';
export const DEFAULT_TOOLTIP_TEXTO_TRIGGER = 'Más información';
export const DEFAULT_TOOLTIP_TEXTO =
  'Texto del tooltip. Edítalo desde el panel de propiedades.';
export const TOOLTIP_BUBBLE_WIDTH_PX = 220;

export function tooltipFallbackSize(triggerTipo: TooltipTriggerTipo): { ancho: number; alto: number } {
  if (triggerTipo === 'texto_subrayado') {
    return { ancho: 12, alto: 4 };
  }
  return { ancho: 4, alto: 4 };
}

export function normalizeTooltipWidget(block: TooltipWidget): TooltipWidget {
  const triggerTipo = block.triggerTipo ?? DEFAULT_TOOLTIP_TRIGGER;
  return {
    tipo: 'tooltip',
    x: block.x,
    y: block.y,
    ancho: block.ancho,
    alto: block.alto,
    zIndex: block.zIndex,
    triggerTipo,
    icono: block.icono ?? DEFAULT_TOOLTIP_ICONO,
    textoTrigger: block.textoTrigger ?? DEFAULT_TOOLTIP_TEXTO_TRIGGER,
    textoTooltip: typeof block.textoTooltip === 'string' ? block.textoTooltip : DEFAULT_TOOLTIP_TEXTO,
    posicion: block.posicion ?? DEFAULT_TOOLTIP_POSICION,
    colorFondo: block.colorFondo ?? DEFAULT_TOOLTIP_COLOR_FONDO,
    colorTexto: block.colorTexto ?? DEFAULT_TOOLTIP_COLOR_TEXTO,
  };
}

export function createDefaultTooltipBlock(marco?: BlockMarco): TooltipWidget {
  const fb = BLOCK_FALLBACKS.tooltip;
  const size = tooltipFallbackSize(DEFAULT_TOOLTIP_TRIGGER);
  const base: TooltipWidget = {
    tipo: 'tooltip',
    triggerTipo: DEFAULT_TOOLTIP_TRIGGER,
    icono: DEFAULT_TOOLTIP_ICONO,
    textoTrigger: DEFAULT_TOOLTIP_TEXTO_TRIGGER,
    textoTooltip: DEFAULT_TOOLTIP_TEXTO,
    posicion: DEFAULT_TOOLTIP_POSICION,
    colorFondo: DEFAULT_TOOLTIP_COLOR_FONDO,
    colorTexto: DEFAULT_TOOLTIP_COLOR_TEXTO,
    x: marco ? marco.izquierdaPct : fb.x,
    y: marco ? marco.arribaPct : fb.y,
    ancho: size.ancho,
    alto: size.alto,
  };
  return normalizeTooltipWidget(base);
}
