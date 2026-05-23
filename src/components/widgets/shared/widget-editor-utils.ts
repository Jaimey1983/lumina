'use client';

import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';

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
