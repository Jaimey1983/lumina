'use client';

import { useLayoutEffect, useState } from 'react';

import {
  pickOverlaySide,
  shiftOverlayToFit,
  type OverlayPlacement,
  type OverlaySide,
} from './overlay-auto-position';

const DEFAULT_PLACEMENT: OverlayPlacement = { side: 'abajo', shiftX: 0, shiftY: 0 };

export function useOverlayAutoPosition({
  active,
  configuredSide,
  triggerRef,
  bubbleRef,
  gap,
  fallbackSize,
  layoutKey,
}: {
  active: boolean;
  configuredSide: OverlaySide | 'auto';
  triggerRef: { current: HTMLElement | null };
  bubbleRef: { current: HTMLElement | null };
  gap: number;
  fallbackSize?: { width: number; height: number };
  /** Cambia al mover el pin (x/y) para recalcular contra el 16:9. */
  layoutKey?: string;
}): OverlayPlacement {
  const [placement, setPlacement] = useState<OverlayPlacement>(DEFAULT_PLACEMENT);

  useLayoutEffect(() => {
    if (!active) return;

    const trigger = triggerRef.current;
    if (!trigger) return;
    const slide = trigger.closest('.canvas-slide');
    if (!slide) return;

    const apply = () => {
      const t = trigger.getBoundingClientRect();
      const s = slide.getBoundingClientRect();
      const bubble = bubbleRef.current;
      const bw = bubble?.offsetWidth || fallbackSize?.width || 0;
      const bh = bubble?.offsetHeight || fallbackSize?.height || 0;
      if (bw <= 0 || bh <= 0) return;

      const side =
        configuredSide === 'auto'
          ? pickOverlaySide({
              topSpace: t.top - s.top,
              bottomSpace: s.bottom - t.bottom,
              leftSpace: t.left - s.left,
              rightSpace: s.right - t.right,
              neededW: bw,
              neededH: bh,
              gap,
            })
          : configuredSide;

      const { x, y } = shiftOverlayToFit({
        side,
        trigger: t,
        bubbleW: bw,
        bubbleH: bh,
        slide: s,
      });
      setPlacement((prev) =>
        prev.side === side && prev.shiftX === x && prev.shiftY === y
          ? prev
          : { side, shiftX: x, shiftY: y },
      );
    };

    apply();
    const bubble = bubbleRef.current;
    if (!bubble || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => apply());
    ro.observe(bubble);
    return () => ro.disconnect();
  }, [
    active,
    configuredSide,
    gap,
    fallbackSize?.width,
    fallbackSize?.height,
    layoutKey,
    triggerRef,
    bubbleRef,
  ]);

  return placement;
}
