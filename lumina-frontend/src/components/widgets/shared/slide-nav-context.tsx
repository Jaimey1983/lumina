'use client';

import { createContext, useContext } from 'react';

export type SlideNavAction =
  | { kind: 'siguiente' }
  | { kind: 'anterior' }
  | { kind: 'ir_a'; index: number };

export type SlideNavValue = {
  navigate: ((action: SlideNavAction) => void) | null;
  slideCount: number;
  /** Índice 0-based de la diapositiva actual (barra de progreso modo slides). */
  slideIndex: number;
};

export const SlideNavContext = createContext<SlideNavValue>({
  navigate: null,
  slideCount: 0,
  slideIndex: 0,
});

export function useSlideNav(): SlideNavValue {
  return useContext(SlideNavContext);
}
