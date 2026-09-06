import type { FlipCardsWidget } from '@/types/slide.types';
import type {
  CarouselWidget,
  ClickRevealWidget,
  PopupWidget,
  TabsWidget,
  TimelineWidget,
  HotspotWidget,
  TooltipWidget,
  BotonWidget,
  ContadorWidget,
  ProgresoWidget,
  RuletaWidget,
  WidgetTipo,
} from '@/types/widget.types';

export type { WidgetTipo };

export const WIDGET_TIPOS: WidgetTipo[] = [
  'flip-cards',
  'tabs',
  'carousel',
  'click-reveal',
  'timeline',
  'popup',
  'hotspot',
  'tooltip',
  'boton',
  'contador',
  'progreso',
  'ruleta',
];

export const WIDGET_LABELS: Record<WidgetTipo, string> = {
  // TODO(migración-etapa-7): retirar la fila flip-cards y borrar este archivo en E7.
  // Ticket: LUM-E7-WIDGETS · 2027-01-31.
  'flip-cards': 'Flip Cards',
  // TODO(migración-etapa-7): retirar la fila tabs y borrar este archivo en E7.
  // Ticket: LUM-E7-WIDGETS · 2027-01-31.
  tabs: 'Tabs',
  // TODO(migración-etapa-7): retirar la fila carousel y borrar este archivo en E7.
  // Ticket: LUM-E7-WIDGETS · 2027-01-31.
  carousel: 'Carousel',
  // TODO(migración-etapa-7): retirar la fila click-reveal y borrar este archivo en E7.
  // Ticket: LUM-E7-WIDGETS · 2027-01-31.
  'click-reveal': 'Click to Reveal',
  // TODO(migración-etapa-7): retirar la fila timeline y borrar este archivo en E7.
  // Ticket: LUM-E7-WIDGETS · 2027-01-31.
  timeline: 'Línea de tiempo',
  // TODO(migración-etapa-7): retirar la fila popup y borrar este archivo en E7.
  // Ticket: LUM-E7-WIDGETS · 2027-01-31.
  popup: 'Popup',
  // TODO(migración-etapa-7): retirar la fila `hotspot` y borrar este archivo en E7.
  // Ticket: LUM-E7-WIDGETS · 2027-01-31.
  hotspot: 'Hotspot',
  // TODO(migración-etapa-7): retirar la fila `tooltip` y borrar este archivo en E7.
  // Ticket: LUM-E7-WIDGETS · 2027-01-31.
  tooltip: 'Tooltip emergente',
  // TODO(migración-etapa-7): retirar la fila `boton` y borrar este archivo en E7.
  // Ticket: LUM-E7-WIDGETS · 2027-01-31.
  boton: 'Botón',
  // TODO(migración-etapa-7): retirar la fila `contador` y borrar este archivo en E7.
  // Ticket: LUM-E7-WIDGETS · 2027-01-31.
  contador: 'Contador / temporizador',
  // TODO(migración-etapa-7): retirar la fila `progreso` y borrar este archivo en E7.
  // Ticket: LUM-E7-WIDGETS · 2027-01-31.
  progreso: 'Barra de progreso',
  // TODO(migración-etapa-7): retirar la fila `ruleta` y borrar este archivo en E7.
  // Ticket: LUM-E7-WIDGETS · 2027-01-31.
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
