'use client';

import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';

import type { WidgetSlideInnerSelection } from '@/types/widget.types';

export function useWidgetDraftField<T>(value: T): [T, (v: T) => void] {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    setDraft(value);
  }, [value]);
  return [draft, setDraft];
}

export function autoResizeWidgetTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

/** Mantiene la altura del textarea sincronizada con el contenido (WYSIWYG en editor). */
export function useWidgetTextareaAutoSize(
  ref: RefObject<HTMLTextAreaElement | null>,
  deps: readonly unknown[],
) {
  useLayoutEffect(() => {
    autoResizeWidgetTextarea(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps listado por el caller
  }, deps);
}

export function stopWidgetInnerPointer(e: React.PointerEvent | React.MouseEvent) {
  e.stopPropagation();
}

export function stopWidgetInnerKeydown(e: React.KeyboardEvent) {
  e.stopPropagation();
}

/** Cierra un overlay al pulsar Escape (Popup, Click to Reveal, Tooltip). */
export function useEscapeToClose(enabled: boolean, onClose?: () => void) {
  useEffect(() => {
    if (!enabled || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [enabled, onClose]);
}

function slideIdFromInnerSelection(
  inner: WidgetSlideInnerSelection | null | undefined,
): string | undefined {
  if (inner?.kind === 'slide' || inner?.kind === 'slide-text' || inner?.kind === 'slide-image') {
    return inner.slideId;
  }
  return undefined;
}

/**
 * Índice de ficha/página local al editor. No persiste `fichaActiva` / `slideActivo`.
 * Si el panel derecho selecciona una ficha (`slideId`), esa es la visible.
 */
export function useWidgetEditorPageIndex(
  slides: { id: string }[],
  innerSelection: WidgetSlideInnerSelection | null | undefined,
  onInnerSelectionChange?: (selection: WidgetSlideInnerSelection) => void,
): { activeIndex: number; setActiveIndex: (index: number) => void } {
  const last = Math.max(0, slides.length - 1);
  const [pageIndex, setPageIndex] = useState(0);

  const selectedId = slideIdFromInnerSelection(innerSelection);
  const fromSelection = selectedId ? slides.findIndex((s) => s.id === selectedId) : -1;
  const activeIndex = Math.min(
    fromSelection >= 0 ? fromSelection : Math.min(pageIndex, last),
    last,
  );

  const setActiveIndex = (index: number) => {
    const next = Math.min(Math.max(0, index), last);
    setPageIndex(next);
    const slide = slides[next];
    if (slide) onInnerSelectionChange?.({ kind: 'slide', slideId: slide.id });
  };

  return { activeIndex, setActiveIndex };
}
