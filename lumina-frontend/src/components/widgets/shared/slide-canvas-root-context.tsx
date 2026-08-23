'use client';

import { createContext, useContext } from 'react';

/** Nodo raíz del lienzo del slide (1280×720 lógico) para portales de overlay (p. ej. Popup). */
export const SlideCanvasRootContext = createContext<HTMLElement | null>(null);

export function useSlideCanvasRoot(): HTMLElement | null {
  return useContext(SlideCanvasRootContext);
}
