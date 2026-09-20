'use client';

import { useMemo, type CSSProperties } from 'react';
import type { SlideTheme } from '@lumina/types/slide';
import { useSlideTheme } from './slide-theme-context.js';
import {
  resolveWidgetThemeTokens,
  type ResolvedWidgetColors,
  type WidgetThemeVarsOptions,
} from './widget-container-styles.js';

export type UseWidgetThemeOverrides = WidgetThemeVarsOptions;

export interface UseWidgetThemeResult {
  theme: SlideTheme | null;
  style: CSSProperties;
  colors: ResolvedWidgetColors;
}

/**
 * Hook que conecta un widget al tema actual del slide (`SlideThemeContext`),
 * aplicando cualquier override configurado por el usuario y emitiendo tanto
 * las variables CSS (--lw-*) como los valores de color resueltos.
 */
export function useWidgetTheme(overrides?: UseWidgetThemeOverrides): UseWidgetThemeResult {
  const { theme } = useSlideTheme();

  const accentOverride = overrides?.accent;
  const accentMutedOverride = overrides?.accentMuted;
  const borderOverride = overrides?.border;
  const navOverride = overrides?.nav;
  const bgOverride = overrides?.bg;
  const surfaceOverride = overrides?.surface;
  const textOverride = overrides?.text;
  const textMutedOverride = overrides?.textMuted;
  const fontFamilyOverride = overrides?.fontFamily;

  return useMemo(() => {
    const { style, colors } = resolveWidgetThemeTokens(theme, {
      accent: accentOverride,
      accentMuted: accentMutedOverride,
      border: borderOverride,
      nav: navOverride,
      bg: bgOverride,
      surface: surfaceOverride,
      text: textOverride,
      textMuted: textMutedOverride,
      fontFamily: fontFamilyOverride,
    });
    return { theme, style, colors };
  }, [
    theme,
    accentOverride,
    accentMutedOverride,
    borderOverride,
    navOverride,
    bgOverride,
    surfaceOverride,
    textOverride,
    textMutedOverride,
    fontFamilyOverride,
  ]);
}
