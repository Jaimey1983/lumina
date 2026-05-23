'use client';

import type { Block, TabsWidget } from '@/types/slide.types';
import type { WidgetCampoEstilo, WidgetSlideContent } from '@/types/widget.types';
import {
  WidgetSlideImageInnerProperties,
  WidgetSlideTextInnerProperties,
} from '@/components/widgets/shared/widget-inner-properties';

import type { TabsInnerSelection } from './tabs-config';
import { normalizeTabsWidget } from './tabs-config';

function patchHeaderStyle(
  block: TabsWidget,
  field: 'tituloWidget' | 'subtituloWidget' | 'instruccion',
  patch: Partial<WidgetCampoEstilo>,
): TabsWidget {
  const prev = block.estilosHeader?.[field] ?? {};
  return {
    ...block,
    estilosHeader: {
      ...block.estilosHeader,
      [field]: { ...prev, ...patch },
    },
  };
}

function patchSlide(
  block: TabsWidget,
  slideId: string,
  patch: Partial<WidgetSlideContent>,
): TabsWidget {
  return {
    ...block,
    fichas: block.fichas.map((f) => (f.id === slideId ? { ...f, ...patch } : f)),
  };
}

export interface TabsInnerPropertiesProps {
  block: TabsWidget;
  selection: TabsInnerSelection;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function TabsTextInnerProperties({
  block: rawBlock,
  selection,
  applyNow,
}: TabsInnerPropertiesProps) {
  const block = normalizeTabsWidget(rawBlock);

  const update = (fn: (w: TabsWidget) => TabsWidget) => {
    void applyNow((b) => (b.tipo === 'tabs' ? fn(normalizeTabsWidget(b)) : b));
  };

  return (
    <WidgetSlideTextInnerProperties
      selection={selection}
      context={{
        slides: block.fichas,
        estilosHeader: block.estilosHeader,
        patchHeaderStyle: (field, patch) =>
          update((w) => patchHeaderStyle(w, field, patch)),
        patchSlide: (slideId, patch) => update((w) => patchSlide(w, slideId, patch)),
      }}
    />
  );
}

export function TabsImageInnerProperties({
  block: rawBlock,
  selection,
  applyNow,
}: TabsInnerPropertiesProps) {
  const block = normalizeTabsWidget(rawBlock);

  return (
    <WidgetSlideImageInnerProperties
      selection={selection}
      context={{
        slides: block.fichas,
        estilosHeader: block.estilosHeader,
        patchHeaderStyle: (field, patch) => {
          void applyNow((b) => {
            if (b.tipo !== 'tabs') return b;
            return patchHeaderStyle(normalizeTabsWidget(b), field, patch);
          });
        },
        patchSlide: (slideId, patch) => {
          void applyNow((b) => {
            if (b.tipo !== 'tabs') return b;
            return patchSlide(normalizeTabsWidget(b), slideId, patch);
          });
        },
      }}
    />
  );
}
