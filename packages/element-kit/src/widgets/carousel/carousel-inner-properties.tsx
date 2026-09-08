'use client';

import type { Block, CarouselWidget } from '@lumina/types/slide';
import type { WidgetCampoEstilo, WidgetSlideContent } from '@lumina/types/widget';
import {
  WidgetSlideImageInnerProperties,
  WidgetSlideTextInnerProperties,
} from '@lumina/editor-shared/widget-inner-properties';

import type { CarouselInnerSelection } from './carousel-config.js';
import { normalizeCarouselWidget } from './carousel-config.js';

function patchHeaderStyle(
  block: CarouselWidget,
  field: 'tituloWidget' | 'subtituloWidget' | 'instruccion',
  patch: Partial<WidgetCampoEstilo>,
): CarouselWidget {
  const prev = block.estilosHeader?.[field] ?? {};
  return {
    ...block,
    estilosHeader: {
      ...block.estilosHeader,
      [field]: { ...prev, ...patch },
    },
  };
}

export function patchCarouselSlide(
  block: CarouselWidget,
  slideId: string,
  patch: Partial<WidgetSlideContent>,
): CarouselWidget {
  return {
    ...block,
    slides: block.slides.map((s) => (s.id === slideId ? { ...s, ...patch } : s)),
  };
}

export interface CarouselInnerPropertiesProps {
  block: CarouselWidget;
  selection: CarouselInnerSelection;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function CarouselTextInnerProperties({
  block: rawBlock,
  selection,
  applyNow,
}: CarouselInnerPropertiesProps) {
  const block = normalizeCarouselWidget(rawBlock);

  const update = (fn: (w: CarouselWidget) => CarouselWidget) => {
    void applyNow((b) => (b.tipo === 'carousel' ? fn(normalizeCarouselWidget(b)) : b));
  };

  return (
    <WidgetSlideTextInnerProperties
      selection={selection}
      context={{
        slides: block.slides,
        estilosHeader: block.estilosHeader,
        getHeaderValue: (field) => block[field],
        patchHeaderValue: (field, value) =>
          update((w) => ({ ...w, [field]: value })),
        patchHeaderStyle: (field, patch) =>
          update((w) => patchHeaderStyle(w, field, patch)),
        patchSlide: (slideId, patch) =>
          update((w) => patchCarouselSlide(w, slideId, patch)),
      }}
    />
  );
}

export function CarouselImageInnerProperties({
  block: rawBlock,
  selection,
  applyNow,
}: CarouselInnerPropertiesProps) {
  const block = normalizeCarouselWidget(rawBlock);

  return (
    <WidgetSlideImageInnerProperties
      selection={selection}
      context={{
        slides: block.slides,
        estilosHeader: block.estilosHeader,
        patchHeaderStyle: (field, patch) => {
          void applyNow((b) => {
            if (b.tipo !== 'carousel') return b;
            return patchHeaderStyle(normalizeCarouselWidget(b), field, patch);
          });
        },
        patchSlide: (slideId, patch) => {
          void applyNow((b) => {
            if (b.tipo !== 'carousel') return b;
            return patchCarouselSlide(normalizeCarouselWidget(b), slideId, patch);
          });
        },
      }}
    />
  );
}
