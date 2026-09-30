'use client';

import type { Block } from '@lumina/types/slide';
import type { ImageCompareWidget, WidgetCampoEstilo } from '@lumina/types/widget';
import { WidgetSlideTextInnerProperties } from '@lumina/editor-shared/widget-inner-properties';

import type { ImageCompareInnerSelection } from './image-compare-types.js';

function patchHeaderStyle(
  block: ImageCompareWidget,
  field: 'tituloWidget' | 'subtituloWidget' | 'instruccion',
  patch: Partial<WidgetCampoEstilo>,
): ImageCompareWidget {
  const prev = block.estilosHeader?.[field] ?? {};
  return {
    ...block,
    estilosHeader: {
      ...block.estilosHeader,
      [field]: { ...prev, ...patch },
    },
  };
}

export interface ImageCompareInnerPropertiesProps {
  block: ImageCompareWidget;
  selection: Extract<ImageCompareInnerSelection, { kind: 'header-text' }>;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function ImageCompareTextInnerProperties({
  block,
  selection,
  applyNow,
}: ImageCompareInnerPropertiesProps) {
  const update = (fn: (w: ImageCompareWidget) => ImageCompareWidget) => {
    void applyNow((b) => (b.tipo === 'image-compare' ? fn(b) : b));
  };

  return (
    <WidgetSlideTextInnerProperties
      selection={selection}
      context={{
        slides: [],
        estilosHeader: block.estilosHeader,
        getHeaderValue: (field) => block[field] ?? '',
        patchHeaderValue: (field, value) =>
          update((w) => ({ ...w, [field]: value })),
        patchHeaderStyle: (field, patch) =>
          update((w) => patchHeaderStyle(w, field, patch)),
        patchSlide: () => undefined,
      }}
    />
  );
}
