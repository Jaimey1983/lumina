import type { FlipCardsWidget } from '@/types/slide.types';
import type { CarouselWidget, TabsWidget, WidgetTipo } from '@/types/widget.types';

export type { WidgetTipo };

export const WIDGET_TIPOS: WidgetTipo[] = ['flip-cards', 'tabs', 'carousel'];

export const WIDGET_LABELS: Record<WidgetTipo, string> = {
  'flip-cards': 'Flip Cards',
  tabs: 'Tabs',
  carousel: 'Carousel',
};

export type WidgetBlock = FlipCardsWidget | TabsWidget | CarouselWidget;

export function isWidgetTipo(value: string): value is WidgetTipo {
  return WIDGET_TIPOS.includes(value as WidgetTipo);
}

export function isCaptivateWidgetBlock(block: { tipo: string }): block is WidgetBlock {
  return isWidgetTipo(block.tipo);
}
