import type { CSSProperties } from 'react';

/** Fondo del contenedor del widget con opacidad. */
export function widgetContainerBackgroundStyle(
  colorFondoContenedor: string,
  opacidadFondoContenedor: number,
): CSSProperties {
  const alpha = opacidadFondoContenedor / 100;
  const hex = colorFondoContenedor;
  if (alpha >= 1) return { backgroundColor: hex };
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})` };
}

export function widgetHeaderPadding(paddingContenedor: number): CSSProperties {
  return {
    paddingLeft: paddingContenedor,
    paddingRight: paddingContenedor,
    paddingTop: paddingContenedor,
  };
}

export function widgetBodyPadding(paddingContenedor: number): CSSProperties {
  return {
    paddingLeft: paddingContenedor,
    paddingRight: paddingContenedor,
    paddingBottom: paddingContenedor,
  };
}

export interface WidgetThemeVarsOptions {
  accent?: string;
  accentMuted?: string;
  border?: string;
  nav?: string;
  bg?: string;
  surface?: string;
  text?: string;
  textMuted?: string;
  fontFamily?: string;
}

/**
 * Genera la escala completa de tokens de diseño semánticos (--lw-*) para widgets,
 * manteniendo además las variables históricas (--widget-*) para compatibilidad total.
 */
export function createWidgetThemeVars(vars?: WidgetThemeVarsOptions): CSSProperties {
  const accent = vars?.accent ?? '#2563eb';
  const accentMuted = vars?.accentMuted ?? '#93c5fd';
  const border = vars?.border ?? '#e2e8f0';
  const nav = vars?.nav ?? '#0f172a';
  const bg = vars?.bg ?? '#ffffff';
  const surface = vars?.surface ?? '#f8fafc';
  const text = vars?.text ?? '#0f172a';
  const textMuted = vars?.textMuted ?? '#64748b';
  const fontFamily = vars?.fontFamily ?? 'inherit';

  return {
    // Compatibilidad previa
    '--widget-accent': accent,
    '--widget-accent-muted': accentMuted,
    '--widget-border': border,
    '--widget-nav': nav,

    // Escala semántica Lumina Widget (--lw-*)
    '--lw-color-primary': accent,
    '--lw-color-primary-muted': accentMuted,
    '--lw-color-accent': accent,
    '--lw-color-accent-muted': accentMuted,
    '--lw-color-border': border,
    '--lw-color-nav': nav,
    '--lw-color-bg': bg,
    '--lw-color-surface': surface,
    '--lw-color-text': text,
    '--lw-color-text-muted': textMuted,

    // Escala de radios
    '--lw-radius-sm': '0.25rem',
    '--lw-radius-md': '0.5rem',
    '--lw-radius-lg': '0.75rem',
    '--lw-radius-full': '9999px',

    // Escala de elevaciones (box-shadow)
    '--lw-shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '--lw-shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    '--lw-shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',

    // Tipografía
    '--lw-font-family': fontFamily,

    // Escala de movimiento / transiciones
    '--lw-motion-fast': '150ms cubic-bezier(0.16, 1, 0.3, 1)',
    '--lw-motion-base': '250ms cubic-bezier(0.16, 1, 0.3, 1)',
  } as CSSProperties;
}

export interface ResolvedWidgetColors {
  primary: string;
  primaryMuted: string;
  bg: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  nav: string;
}

export interface ResolvedWidgetTheme {
  style: CSSProperties;
  colors: ResolvedWidgetColors;
}

/**
 * Resuelve los tokens semánticos y colores a partir de un SlideTheme (o fallback)
 * y posibles overrides explícitos del widget.
 */
export function resolveWidgetThemeTokens(
  theme?: import('@lumina/types/slide').SlideTheme | null,
  overrides?: WidgetThemeVarsOptions,
): ResolvedWidgetTheme {
  const primary = overrides?.accent ?? theme?.colores?.acento ?? '#2563eb';
  const text = overrides?.text ?? theme?.colores?.texto ?? '#0f172a';
  const textMuted = overrides?.textMuted ?? theme?.colores?.textoSecundario ?? '#64748b';
  const bg = overrides?.bg ?? theme?.colores?.fondo ?? '#ffffff';
  const border = overrides?.border ?? '#e2e8f0';
  const primaryMuted = overrides?.accentMuted ?? '#93c5fd';
  const nav = overrides?.nav ?? text;
  const surface = overrides?.surface ?? (bg === '#ffffff' ? '#f8fafc' : bg);
  const fontFamily = overrides?.fontFamily ?? theme?.fuente ?? 'inherit';

  const style = createWidgetThemeVars({
    accent: primary,
    accentMuted: primaryMuted,
    border,
    nav,
    bg,
    surface,
    text,
    textMuted,
    fontFamily,
  });

  const colors: ResolvedWidgetColors = {
    primary,
    primaryMuted,
    bg,
    surface,
    text,
    textMuted,
    border,
    nav,
  };

  return { style, colors };
}

/** Variables CSS comunes de acento/borde/nav para chrome del widget (retrocompatible). */
export function widgetChromeVarsStyle(vars: {
  accent?: string;
  accentMuted?: string;
  border?: string;
  nav?: string;
}): CSSProperties {
  return createWidgetThemeVars({
    accent: vars.accent,
    accentMuted: vars.accentMuted,
    border: vars.border,
    nav: vars.nav,
  });
}


