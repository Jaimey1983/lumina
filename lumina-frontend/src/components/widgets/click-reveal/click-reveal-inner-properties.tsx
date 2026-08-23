'use client';

import type { Block, ClickRevealWidget } from '@/types/slide.types';
import type { WidgetCampoEstilo, WidgetSlideContent } from '@/types/widget.types';
import {
  WidgetSlideImageInnerProperties,
  WidgetSlideTextInnerProperties,
} from '@/components/widgets/shared/widget-inner-properties';

import type { ClickRevealInnerSelection } from '@/types/widget.types';
import { normalizeClickRevealWidget } from './click-reveal-config';

function patchHeaderStyle(
  block: ClickRevealWidget,
  field: 'tituloWidget' | 'subtituloWidget' | 'instruccion',
  patch: Partial<WidgetCampoEstilo>,
): ClickRevealWidget {
  const prev = block.estilosHeader?.[field] ?? {};
  return {
    ...block,
    estilosHeader: {
      ...block.estilosHeader,
      [field]: { ...prev, ...patch },
    },
  };
}

function patchOverlay(
  block: ClickRevealWidget,
  overlayId: string,
  patch: Partial<WidgetSlideContent>,
): ClickRevealWidget {
  return {
    ...block,
    overlays: block.overlays.map((o) => (o.id === overlayId ? { ...o, ...patch } : o)),
  };
}

function buildSlideContext(block: ClickRevealWidget) {
  return {
    slides: block.overlays,
    estilosHeader: block.estilosHeader,
    patchHeaderStyle: (field: 'tituloWidget' | 'subtituloWidget' | 'instruccion', patch: Partial<WidgetCampoEstilo>) =>
      patchHeaderStyle(block, field, patch),
    patchSlide: (slideId: string, patch: Partial<WidgetSlideContent>) =>
      patchOverlay(block, slideId, patch),
  };
}

export interface ClickRevealInnerPropertiesProps {
  block: ClickRevealWidget;
  selection: ClickRevealInnerSelection;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function ClickRevealTextInnerProperties({
  block: rawBlock,
  selection,
  applyNow,
}: ClickRevealInnerPropertiesProps) {
  const block = normalizeClickRevealWidget(rawBlock);

  const update = (fn: (w: ClickRevealWidget) => ClickRevealWidget) => {
    void applyNow((b) => (b.tipo === 'click-reveal' ? fn(normalizeClickRevealWidget(b)) : b));
  };

  if (selection.kind !== 'header-text' && selection.kind !== 'overlay-text') {
    return null;
  }

  const mappedSelection =
    selection.kind === 'overlay-text'
      ? { kind: 'slide-text' as const, slideId: selection.overlayId, field: selection.field }
      : selection;

  return (
    <WidgetSlideTextInnerProperties
      selection={mappedSelection}
      context={{
        slides: buildSlideContext(block).slides,
        estilosHeader: block.estilosHeader,
        patchHeaderStyle: (field, patch) =>
          update((w) => patchHeaderStyle(w, field, patch)),
        patchSlide: (slideId, patch) =>
          update((w) => patchOverlay(w, slideId, patch)),
      }}
    />
  );
}

export function ClickRevealImageInnerProperties({
  block: rawBlock,
  selection,
  applyNow,
}: ClickRevealInnerPropertiesProps) {
  const block = normalizeClickRevealWidget(rawBlock);

  const update = (fn: (w: ClickRevealWidget) => ClickRevealWidget) => {
    void applyNow((b) => (b.tipo === 'click-reveal' ? fn(normalizeClickRevealWidget(b)) : b));
  };

  if (selection.kind === 'overlay-image') {
    const mappedSelection = {
      kind: 'slide-image' as const,
      slideId: selection.overlayId,
    };
    return (
      <WidgetSlideImageInnerProperties
        selection={mappedSelection}
        context={{
          slides: buildSlideContext(block).slides,
          estilosHeader: block.estilosHeader,
          patchHeaderStyle: (field, patch) =>
            update((w) => patchHeaderStyle(w, field, patch)),
          patchSlide: (slideId, patch) =>
            update((w) => patchOverlay(w, slideId, patch)),
        }}
      />
    );
  }

  if (selection.kind === 'trigger-image') {
    const trigger = block.triggers.find((t) => t.id === selection.triggerId);
    if (!trigger) return null;

    const pseudoSlide: WidgetSlideContent = {
      id: trigger.id,
      etiqueta: trigger.etiqueta,
      encabezado: trigger.titulo ?? '',
      cuerpo: '',
      imagen: trigger.imagen,
      imagenAlt: trigger.imagenAlt,
      imagenObjectFit: trigger.imagenObjectFit,
      imagenObjectPosition: trigger.imagenObjectPosition,
      imagenRadio: trigger.imagenRadio,
      imagenOpacidad: trigger.imagenOpacidad,
      imagenBrillo: trigger.imagenBrillo,
      imagenEscalaDeGrises: trigger.imagenEscalaDeGrises,
      imagenEscala: trigger.imagenEscala,
      imagenOffsetX: trigger.imagenOffsetX,
      imagenOffsetY: trigger.imagenOffsetY,
    };

    return (
      <WidgetSlideImageInnerProperties
        selection={{ kind: 'slide-image', slideId: trigger.id }}
        context={{
          slides: [pseudoSlide],
          estilosHeader: block.estilosHeader,
          patchHeaderStyle: (field, patch) =>
            update((w) => patchHeaderStyle(w, field, patch)),
          patchSlide: (_slideId, patch) =>
            update((w) => ({
              ...w,
              triggers: w.triggers.map((t) =>
                t.id === selection.triggerId
                  ? {
                      ...t,
                      imagen: patch.imagen ?? t.imagen,
                      imagenAlt: patch.imagenAlt ?? t.imagenAlt,
                      imagenObjectFit: patch.imagenObjectFit ?? t.imagenObjectFit,
                      imagenObjectPosition: patch.imagenObjectPosition ?? t.imagenObjectPosition,
                      imagenRadio: patch.imagenRadio ?? t.imagenRadio,
                      imagenOpacidad: patch.imagenOpacidad ?? t.imagenOpacidad,
                      imagenBrillo: patch.imagenBrillo ?? t.imagenBrillo,
                      imagenEscalaDeGrises: patch.imagenEscalaDeGrises ?? t.imagenEscalaDeGrises,
                      imagenEscala: patch.imagenEscala ?? t.imagenEscala,
                      imagenOffsetX: patch.imagenOffsetX ?? t.imagenOffsetX,
                      imagenOffsetY: patch.imagenOffsetY ?? t.imagenOffsetY,
                    }
                  : t,
              ),
            })),
        }}
      />
    );
  }

  return null;
}
