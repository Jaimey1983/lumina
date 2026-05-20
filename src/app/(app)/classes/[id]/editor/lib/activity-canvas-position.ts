import type { DragEndEvent } from '@dnd-kit/core';
import type { BlockMarco } from '@/types/slide.types';

/**
 * Mismo tamaño que la inserción por click (sin `marco`):
 * `ACTIVITY_POSITION_FALLBACK` en slide-renderer → ancho/alto 90%.
 */
export const DEFAULT_ACTIVITY_SIZE_PCT = { anchoPct: 90, altoPct: 90 } as const;

const MARGIN_PCT = 5;

export function clientPointToActivityMarco(
  canvasRect: DOMRect,
  clientX: number,
  clientY: number,
  sizePct: { anchoPct: number; altoPct: number } = DEFAULT_ACTIVITY_SIZE_PCT,
): BlockMarco {
  const { anchoPct, altoPct } = sizePct;

  let izquierdaPct =
    ((clientX - canvasRect.left) / canvasRect.width) * 100 - anchoPct / 2;
  let arribaPct =
    ((clientY - canvasRect.top) / canvasRect.height) * 100 - altoPct / 2;

  izquierdaPct = Math.min(
    Math.max(izquierdaPct, MARGIN_PCT),
    100 - anchoPct - MARGIN_PCT,
  );
  arribaPct = Math.min(Math.max(arribaPct, MARGIN_PCT), 100 - altoPct - MARGIN_PCT);

  return { izquierdaPct, arribaPct, anchoPct, altoPct };
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
