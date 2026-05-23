import type { Block, CarouselWidget, TabsWidget } from '@/types/slide.types';
import type {
  WidgetSlideContent,
  WidgetSlideInnerSelection,
  WidgetSlideTextBlock,
} from '@/types/widget.types';
import { getBlockAtPath } from '@/lib/class-slide-normalize';

export function createWidgetSlideTextBlock(
  partial?: Partial<Omit<WidgetSlideTextBlock, 'id' | 'tipo'>>,
): WidgetSlideTextBlock {
  return {
    id: crypto.randomUUID(),
    tipo: 'texto',
    contenido: 'Texto nuevo',
    x: 8,
    y: 55,
    ancho: 84,
    tamanoFuente: '16px',
    color: '#334155',
    negrita: false,
    alineacion: 'izquierda',
    ...partial,
  };
}

export function resolveSlideIdFromInnerSelection(
  inner: WidgetSlideInnerSelection | null | undefined,
  slides: WidgetSlideContent[],
  activeIndex: number,
): string | undefined {
  if (inner?.kind === 'slide' || inner?.kind === 'slide-text' || inner?.kind === 'slide-image') {
    return inner.slideId;
  }
  const idx = Math.min(Math.max(0, activeIndex), Math.max(0, slides.length - 1));
  return slides[idx]?.id;
}

export type WidgetSlideInsertTarget =
  | { kind: 'tabs'; blockPath: string; slideId: string; widget: TabsWidget }
  | { kind: 'carousel'; blockPath: string; slideId: string; widget: CarouselWidget };

export function resolveWidgetSlideInsertTarget(
  selectedBlockPath: string | null,
  bloques: Block[],
  tabsInner: WidgetSlideInnerSelection | null | undefined,
  carouselInner: WidgetSlideInnerSelection | null | undefined,
): WidgetSlideInsertTarget | null {
  if (!selectedBlockPath) return null;
  const block = getBlockAtPath(bloques, selectedBlockPath);
  if (!block) return null;

  if (block.tipo === 'tabs') {
    const widget = block as TabsWidget;
    const slideId = resolveSlideIdFromInnerSelection(
      tabsInner,
      widget.fichas,
      widget.configuracion.fichaActiva,
    );
    if (!slideId) return null;
    return { kind: 'tabs', blockPath: selectedBlockPath, slideId, widget };
  }

  if (block.tipo === 'carousel') {
    const widget = block as CarouselWidget;
    const slideId = resolveSlideIdFromInnerSelection(
      carouselInner,
      widget.slides,
      widget.configuracion.slideActivo,
    );
    if (!slideId) return null;
    return { kind: 'carousel', blockPath: selectedBlockPath, slideId, widget };
  }

  return null;
}

export function appendTextBlockToWidgetSlide(
  widget: TabsWidget | CarouselWidget,
  slideId: string,
  textBlock: WidgetSlideTextBlock,
): TabsWidget | CarouselWidget {
  if (widget.tipo === 'tabs') {
    return {
      ...widget,
      fichas: widget.fichas.map((f) =>
        f.id === slideId ? { ...f, bloques: [...(f.bloques ?? []), textBlock] } : f,
      ),
    };
  }
  return {
    ...widget,
    slides: widget.slides.map((s) =>
      s.id === slideId ? { ...s, bloques: [...(s.bloques ?? []), textBlock] } : s,
    ),
  };
}

export function patchWidgetSlideTextBlock(
  widget: TabsWidget | CarouselWidget,
  slideId: string,
  blockId: string,
  patch: Partial<WidgetSlideTextBlock>,
): TabsWidget | CarouselWidget {
  const patchSlide = (slide: WidgetSlideContent) => {
    if (slide.id !== slideId) return slide;
    return {
      ...slide,
      bloques: (slide.bloques ?? []).map((b) => (b.id === blockId ? { ...b, ...patch } : b)),
    };
  };

  if (widget.tipo === 'tabs') {
    return { ...widget, fichas: widget.fichas.map(patchSlide) };
  }
  return { ...widget, slides: widget.slides.map(patchSlide) };
}
