'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { SlideTheme } from '@lumina/types/slide';

export interface SlideThemeValue {
  /** Tema activo del slide (predefinido o personalizado); `null` = sin tema. */
  theme: SlideTheme | null;
}

const SlideThemeContext = createContext<SlideThemeValue>({ theme: null });

export function SlideThemeProvider({
  value,
  children,
}: {
  value: SlideThemeValue;
  children: ReactNode;
}) {
  return <SlideThemeContext.Provider value={value}>{children}</SlideThemeContext.Provider>;
}

export function useSlideTheme(): SlideThemeValue {
  return useContext(SlideThemeContext);
}
