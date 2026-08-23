import type { CSSProperties } from 'react';
import type { TooltipWidget } from '@/types/widget.types';
import {
  DEFAULT_TOOLTIP_COLOR_FONDO,
  DEFAULT_TOOLTIP_COLOR_TEXTO,
  DEFAULT_TOOLTIP_ICONO,
  DEFAULT_TOOLTIP_POSICION,
  DEFAULT_TOOLTIP_TEXTO,
  DEFAULT_TOOLTIP_TEXTO_TRIGGER,
  DEFAULT_TOOLTIP_TRIGGER,
  TOOLTIP_BUBBLE_WIDTH_PX,
  normalizeTooltipWidget,
} from './tooltip-defaults';

export {
  DEFAULT_TOOLTIP_COLOR_FONDO,
  DEFAULT_TOOLTIP_COLOR_TEXTO,
  DEFAULT_TOOLTIP_ICONO,
  DEFAULT_TOOLTIP_POSICION,
  DEFAULT_TOOLTIP_TEXTO,
  DEFAULT_TOOLTIP_TEXTO_TRIGGER,
  DEFAULT_TOOLTIP_TRIGGER,
  TOOLTIP_BUBBLE_WIDTH_PX,
  createDefaultTooltipBlock,
  normalizeTooltipWidget,
  tooltipFallbackSize,
} from './tooltip-defaults';

export interface MergedTooltipConfig {
  triggerTipo: TooltipWidget['triggerTipo'];
  icono: string;
  textoTrigger: string;
  textoTooltip: string;
  posicion: TooltipWidget['posicion'];
  colorFondo: string;
  colorTexto: string;
  anchoBurbuja: number;
}

export function mergedTooltipConfig(block: TooltipWidget): MergedTooltipConfig {
  const w = normalizeTooltipWidget(block);
  return {
    triggerTipo: w.triggerTipo ?? DEFAULT_TOOLTIP_TRIGGER,
    icono: w.icono ?? DEFAULT_TOOLTIP_ICONO,
    textoTrigger: w.textoTrigger ?? DEFAULT_TOOLTIP_TEXTO_TRIGGER,
    textoTooltip: w.textoTooltip || DEFAULT_TOOLTIP_TEXTO,
    posicion: w.posicion ?? DEFAULT_TOOLTIP_POSICION,
    colorFondo: w.colorFondo ?? DEFAULT_TOOLTIP_COLOR_FONDO,
    colorTexto: w.colorTexto ?? DEFAULT_TOOLTIP_COLOR_TEXTO,
    anchoBurbuja: TOOLTIP_BUBBLE_WIDTH_PX,
  };
}

export function tooltipChromeStyle(block: TooltipWidget): CSSProperties {
  const cfg = mergedTooltipConfig(block);
  return {
    ['--tooltip-bg' as string]: cfg.colorFondo,
    ['--tooltip-fg' as string]: cfg.colorTexto,
    ['--tooltip-width' as string]: `${cfg.anchoBurbuja}px`,
  };
}
