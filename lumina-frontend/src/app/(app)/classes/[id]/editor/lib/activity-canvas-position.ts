import type { DragEndEvent } from '@dnd-kit/core';

import type { WidgetTipo } from '@/types/widget.types';
import { clampDragCorner } from '@/hooks/use-block-drag';
import { BLOCK_FALLBACKS, type BlockMarco } from '@/types/slide.types';

/**
 * Mismo tamaño que la inserción por click (sin `marco`):
 * `ACTIVITY_POSITION_FALLBACK` en slide-renderer → ancho/alto 90%.
 */
export const DEFAULT_ACTIVITY_SIZE_PCT = { anchoPct: 90, altoPct: 90 } as const;

const MARGIN_PCT = 5;

export type CanvasSizePct = { anchoPct: number; altoPct: number };

/** Tamaño de inserción idéntico a `BLOCK_FALLBACKS` (click en el rail, sin arrastrar). */
export function getWidgetDropSizePct(type: WidgetTipo): CanvasSizePct {
  const fb = widgetCanvasFallback(type);
  return { anchoPct: fb.ancho, altoPct: fb.alto };
}

function widgetCanvasFallback(type: WidgetTipo): { ancho: number; alto: number } {
  switch (type) {
    case 'flip-cards':
      return BLOCK_FALLBACKS.flipCards;
    case 'tabs':
      return BLOCK_FALLBACKS.tabs;
    case 'carousel':
      return BLOCK_FALLBACKS.carousel;
    case 'click-reveal':
      return BLOCK_FALLBACKS.clickReveal;
    case 'timeline':
      return BLOCK_FALLBACKS.timeline;
    case 'popup':
      return BLOCK_FALLBACKS.popup;
    case 'hotspot':
      return BLOCK_FALLBACKS.hotspot;
    case 'tooltip':
      return BLOCK_FALLBACKS.tooltip;
    case 'boton':
      return BLOCK_FALLBACKS.boton;
    case 'contador':
      return BLOCK_FALLBACKS.contador;
    case 'progreso':
      return BLOCK_FALLBACKS.progreso;
    case 'ruleta':
      return BLOCK_FALLBACKS.ruleta;
  }
}

function clientPointToCanvasPercent(
  canvasRect: DOMRect,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const width = canvasRect.width || 1;
  const height = canvasRect.height || 1;
  return {
    x: ((clientX - canvasRect.left) / width) * 100,
    y: ((clientY - canvasRect.top) / height) * 100,
  };
}

export function clientPointToActivityMarco(
  canvasRect: DOMRect,
  clientX: number,
  clientY: number,
  sizePct: CanvasSizePct = DEFAULT_ACTIVITY_SIZE_PCT,
): BlockMarco {
  const { anchoPct, altoPct } = sizePct;
  const cursor = clientPointToCanvasPercent(canvasRect, clientX, clientY);

  let izquierdaPct = cursor.x - anchoPct / 2;
  let arribaPct = cursor.y - altoPct / 2;

  izquierdaPct = Math.min(
    Math.max(izquierdaPct, MARGIN_PCT),
    100 - anchoPct - MARGIN_PCT,
  );
  arribaPct = Math.min(Math.max(arribaPct, MARGIN_PCT), 100 - altoPct - MARGIN_PCT);

  return { izquierdaPct, arribaPct, anchoPct, altoPct };
}

/**
 * Drop de widget desde el rail: centra el tamaño real en el cursor y clama
 * el origen como drag/nudge (visible mínima en 0–100). No usa el margen 5 %
 * de actividades (ese margen fija un bloque 90 % en 5,5).
 */
export function clientPointToWidgetMarco(
  canvasRect: DOMRect,
  clientX: number,
  clientY: number,
  sizePct: CanvasSizePct,
): BlockMarco {
  const { anchoPct, altoPct } = sizePct;
  const cursor = clientPointToCanvasPercent(canvasRect, clientX, clientY);
  const { x, y } = clampDragCorner(cursor.x - anchoPct / 2, cursor.y - altoPct / 2, anchoPct, altoPct);
  return { izquierdaPct: x, arribaPct: y, anchoPct, altoPct };
}

export function getDropClientPoint(event: DragEndEvent): { clientX: number; clientY: number } | null {
  const translated = event.active.rect.current.translated;
  if (translated) {
    return {
      clientX: translated.left + translated.width / 2,
      clientY: translated.top + translated.height / 2,
    };
  }
  const ev = event.activatorEvent;
  if (ev && 'clientX' in ev && 'clientY' in ev) {
    return { clientX: ev.clientX as number, clientY: ev.clientY as number };
  }
  return null;
}

export function isActivityPanelDrag(active: { data: { current?: unknown } }): boolean {
  const data = active.data.current as { source?: string } | undefined;
  return data?.source === 'activity-panel';
}

export function isWidgetPanelDrag(active: { data: { current?: unknown } }): boolean {
  const data = active.data.current as { source?: string } | undefined;
  return data?.source === 'widget-panel';
}

export function isCanvasPanelDrag(active: { data: { current?: unknown } }): boolean {
  return isActivityPanelDrag(active) || isWidgetPanelDrag(active);
}
