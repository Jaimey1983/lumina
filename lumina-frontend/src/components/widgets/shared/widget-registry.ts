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
  // TODO(migración-etapa-5): retirar la fila `hotspot` de este registro cuando
  // E5 conecte ElementRegistry al canvas. Ticket: LUM-E5-WIDGETS · 2026-12-31.
  hotspot: 'Hotspot',
  // TODO(migración-etapa-5): retirar la fila `tooltip` de este registro cuando
  // E5 conecte ElementRegistry al canvas. Ticket: LUM-E5-WIDGETS · 2026-12-31.
  tooltip: 'Tooltip emergente',
  boton: 'Botón',
  // TODO(migración-etapa-5): retirar la fila `contador` de este registro cuando
  // E5 conecte ElementRegistry al canvas. Ticket: LUM-E5-WIDGETS · 2026-12-31.
  contador: 'Contador / temporizador',
  // TODO(migración-etapa-5): retirar la fila `progreso` de este registro cuando
  // E5 conecte ElementRegistry al canvas. Ticket: LUM-E5-WIDGETS · 2026-12-31.
  progreso: 'Barra de progreso',
  // TODO(migración-etapa-5): retirar la fila `ruleta` de este registro cuando
  // E5 conecte ElementRegistry al canvas. Ticket: LUM-E5-WIDGETS · 2026-12-31.
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

// TODO(migración-etapa-3): retirar el Botón viejo de este registro cuando E3
// migre el resto de widgets a ElementRegistry (@lumina/element-kit). El piloto
// E1.4 ya registra `botonDefinition` en el kit; el canvas sigue despachando
// desde aquí hasta E3/E5. Ticket: LUM-E3-BOTON · fecha objetivo: 2026-10-31.
