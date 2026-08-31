import type { FlipCardsWidget } from '@/types/slide.types';
import type { CarouselWidget, ClickRevealWidget, PopupWidget, TabsWidget, TimelineWidget, HotspotWidget, TooltipWidget, BotonWidget, ContadorWidget, ProgresoWidget, RuletaWidget, WidgetTipo } from '@/types/widget.types';

export type { WidgetTipo };

export const WIDGET_TIPOS: WidgetTipo[] = ['flip-cards', 'tabs', 'carousel', 'click-reveal', 'timeline', 'popup', 'hotspot', 'tooltip', 'boton', 'contador', 'progreso', 'ruleta'];

export const WIDGET_LABELS: Record<WidgetTipo, string> = {
  'flip-cards': 'Flip Cards',
  tabs: 'Tabs',
  carousel: 'Carousel',
  'click-reveal': 'Click to Reveal',
  timeline: 'Línea de tiempo',
  popup: 'Popup',
  hotspot: 'Hotspot',
  tooltip: 'Tooltip emergente',
  boton: 'Botón',
  contador: 'Contador / temporizador',
  progreso: 'Barra de progreso',
  ruleta: 'Ruleta',
};

export type WidgetBlock =
  | FlipCardsWidget
  | TabsWidget
  | CarouselWidget
  | ClickRevealWidget
  | TimelineWidget
  | PopupWidget
  | HotspotWidget
  | TooltipWidget
  | BotonWidget
  | ContadorWidget
  | ProgresoWidget
  | RuletaWidget;

export function isWidgetTipo(value: string): value is WidgetTipo {
  return WIDGET_TIPOS.includes(value as WidgetTipo);
}

export function isCaptivateWidgetBlock(block: { tipo: string }): block is WidgetBlock {
  return isWidgetTipo(block.tipo);
}
