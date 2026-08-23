'use client';

import type { Block } from '@/types/slide.types';
import type {
  TimelineWidget,
  WidgetCampoEstilo,
  WidgetSlideContent,
  WidgetSlideInnerSelection,
} from '@/types/widget.types';
import {
  WidgetSlideImageInnerProperties,
  WidgetSlideTextInnerProperties,
} from '@/components/widgets/shared/widget-inner-properties';

import type { TimelineInnerSelection } from './timeline-config';
import { normalizeTimelineWidget } from './timeline-config';

function patchHeaderStyle(
  block: TimelineWidget,
  field: 'tituloWidget' | 'subtituloWidget' | 'instruccion',
  patch: Partial<WidgetCampoEstilo>,
): TimelineWidget {
  const prev = block.estilosHeader?.[field] ?? {};
  return {
    ...block,
    estilosHeader: {
      ...block.estilosHeader,
      [field]: { ...prev, ...patch },
    },
  };
}

export interface TimelineInnerPropertiesProps {
  block: TimelineWidget;
  selection: TimelineInnerSelection;
  applyNow: (fn: (b: Block) => Block) => Promise<void>;
}

export function TimelineTextInnerProperties({
  block: rawBlock,
  selection,
  applyNow,
}: TimelineInnerPropertiesProps) {
  const block = normalizeTimelineWidget(rawBlock);

  const update = (fn: (w: TimelineWidget) => TimelineWidget) => {
    void applyNow((b) => (b.tipo === 'timeline' ? fn(normalizeTimelineWidget(b as TimelineWidget)) : b));
  };

  if (selection.kind !== 'header-text' && selection.kind !== 'texto') {
    return null;
  }

  const mappedSelection: WidgetSlideInnerSelection =
    selection.kind === 'texto'
      ? {
          kind: 'slide-text',
          slideId: block.nodos[selection.nodoIndex].id,
          field:
            selection.field === 'etiqueta'
              ? 'encabezado'
              : selection.field === 'titulo'
                ? 'subtitulo'
                : 'cuerpo',
        }
      : selection;

  const pseudoSlides: WidgetSlideContent[] = block.nodos.map((n) => ({
    id: n.id,
    etiqueta: n.etiqueta,
    encabezado: n.etiqueta,
    subtitulo: n.tituloNodo ?? '',
    cuerpo: n.cuerpo,
    estiloEncabezado: n.estiloEtiqueta,
    estiloSubtitulo: n.estiloTituloNodo,
    estiloCuerpo: n.estiloCuerpo,
  }));

  return (
    <WidgetSlideTextInnerProperties
      selection={mappedSelection}
      context={{
        slides: pseudoSlides,
        estilosHeader: block.estilosHeader,
        patchHeaderStyle: (field, patch) =>
          update((w) => patchHeaderStyle(w, field, patch)),
        patchSlide: (slideId, patch) =>
          update((w) => ({
            ...w,
            nodos: w.nodos.map((n) =>
              n.id === slideId
                ? {
                    ...n,
                    etiqueta: patch.encabezado ?? n.etiqueta,
                    tituloNodo: patch.subtitulo ?? n.tituloNodo,
                    cuerpo: patch.cuerpo ?? n.cuerpo,
                    estiloEtiqueta: patch.estiloEncabezado ?? n.estiloEtiqueta,
                    estiloTituloNodo: patch.estiloSubtitulo ?? n.estiloTituloNodo,
                    estiloCuerpo: patch.estiloCuerpo ?? n.estiloCuerpo,
                  }
                : n,
            ),
          })),
      }}
    />
  );
}

export function TimelineImageInnerProperties({
  block: rawBlock,
  selection,
  applyNow,
}: TimelineInnerPropertiesProps) {
  const block = normalizeTimelineWidget(rawBlock);

  const update = (fn: (w: TimelineWidget) => TimelineWidget) => {
    void applyNow((b) => (b.tipo === 'timeline' ? fn(normalizeTimelineWidget(b as TimelineWidget)) : b));
  };

  if (selection.kind === 'imagen') {
    const mappedSelection = {
      kind: 'slide-image' as const,
      slideId: block.nodos[selection.nodoIndex].id,
    };
    const pseudoSlides: WidgetSlideContent[] = block.nodos.map((n) => ({
      id: n.id,
      etiqueta: n.etiqueta,
      encabezado: '',
      subtitulo: '',
      cuerpo: '',
      imagen: n.imagen,
      imagenAlt: n.imagenAlt,
      imagenObjectFit: n.imagenObjectFit,
      imagenObjectPosition: n.imagenObjectPosition,
      imagenRadio: n.imagenRadio,
      imagenOpacidad: n.imagenOpacidad,
      imagenBrillo: n.imagenBrillo,
      imagenEscalaDeGrises: n.imagenEscalaDeGrises,
      imagenEscala: n.imagenEscala,
      imagenOffsetX: n.imagenOffsetX,
      imagenOffsetY: n.imagenOffsetY,
    }));

    return (
      <WidgetSlideImageInnerProperties
        selection={mappedSelection}
        context={{
          slides: pseudoSlides,
          estilosHeader: block.estilosHeader,
          patchHeaderStyle: (field, patch) =>
            update((w) => patchHeaderStyle(w, field, patch)),
          patchSlide: (slideId, patch) =>
            update((w) => ({
              ...w,
              nodos: w.nodos.map((n) => (n.id === slideId ? {
                ...n,
                imagen: patch.imagen ?? n.imagen,
                imagenAlt: patch.imagenAlt ?? n.imagenAlt,
                imagenObjectFit: patch.imagenObjectFit ?? n.imagenObjectFit,
                imagenObjectPosition: patch.imagenObjectPosition ?? n.imagenObjectPosition,
                imagenRadio: patch.imagenRadio ?? n.imagenRadio,
                imagenOpacidad: patch.imagenOpacidad ?? n.imagenOpacidad,
                imagenBrillo: patch.imagenBrillo ?? n.imagenBrillo,
                imagenEscalaDeGrises: patch.imagenEscalaDeGrises ?? n.imagenEscalaDeGrises,
                imagenEscala: patch.imagenEscala ?? n.imagenEscala,
                imagenOffsetX: patch.imagenOffsetX ?? n.imagenOffsetX,
                imagenOffsetY: patch.imagenOffsetY ?? n.imagenOffsetY,
              } : n)),
            })),
        }}
      />
    );
  }

  return null;
}
