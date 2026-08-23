'use client';

import type { Block } from '@/types/slide.types';
import type { HotspotInnerSelection, HotspotWidget } from '@/types/widget.types';
import {
  WidgetSlideImageInnerProperties,
  WidgetSlideTextInnerProperties,
} from '@/components/widgets/shared/widget-inner-properties';
import { normalizeHotspotWidget } from './hotspot-config';

export interface HotspotInnerPropertiesProps {
  block: HotspotWidget;
  selection: HotspotInnerSelection;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function HotspotTextInnerProperties({
  block: rawBlock,
  selection,
  applyNow,
}: HotspotInnerPropertiesProps) {
  const block = normalizeHotspotWidget(rawBlock);

  const update = (fn: (w: HotspotWidget) => HotspotWidget) => {
    void applyNow((b) => (b.tipo === 'hotspot' ? fn(normalizeHotspotWidget(b)) : b));
  };

  if (selection.kind !== 'overlay-text') return null;

  return (
    <WidgetSlideTextInnerProperties
      selection={{
        kind: 'slide-text',
        slideId: block.overlay.id,
        field: selection.field,
      }}
      context={{
        slides: [block.overlay],
        estilosHeader: block.estilosHeader,
        patchHeaderStyle: () => {},
        patchSlide: (_slideId, patch) => {
          update((w) => ({ ...w, overlay: { ...w.overlay, ...patch } }));
        },
      }}
    />
  );
}

export function HotspotImageInnerProperties({
  block: rawBlock,
  selection,
  applyNow,
}: HotspotInnerPropertiesProps) {
  const block = normalizeHotspotWidget(rawBlock);

  const update = (fn: (w: HotspotWidget) => HotspotWidget) => {
    void applyNow((b) => (b.tipo === 'hotspot' ? fn(normalizeHotspotWidget(b)) : b));
  };

  if (selection.kind !== 'overlay-image') return null;

  return (
    <WidgetSlideImageInnerProperties
      selection={{ kind: 'slide-image', slideId: block.overlay.id }}
      context={{
        slides: [block.overlay],
        estilosHeader: block.estilosHeader,
        patchHeaderStyle: () => {},
        patchSlide: (_slideId, patch) => {
          update((w) => ({ ...w, overlay: { ...w.overlay, ...patch } }));
        },
      }}
    />
  );
}
